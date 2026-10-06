'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');

async function setup(t, enabled = true) {
  const fixture = await startFixture();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  t.after(async () => { await browser.close(); await fixture.close(); });
  const login = await fixture.login();
  await context.addCookies([{ name: 'nutripro_session', value: login.cookie.split('=')[1], url: fixture.config.origin }]);
  await context.route('**/api/chat/status', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ enabled, configured: enabled, model: 'gemini-test' }) }));
  const page = await context.newPage();
  return { fixture, context, page };
}

test('chat is authenticated and disabled until configured, with mobile layout', async t => {
  const { fixture, context, page } = await setup(t, false);
  await page.goto(`${fixture.config.origin}/chat`);
  await page.getByRole('heading', { name: 'Assistente non ancora attivo' }).waitFor();
  assert.equal(await page.getByLabel('La tua domanda').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await context.clearCookies();
  await page.reload();
  await page.waitForURL('**/login');
});

test('chat sends CSRF and general text only, renders HTML safely and never persists history', async t => {
  const { fixture, context, page } = await setup(t);
  const calls = [];
  await context.route('**/api/chat', async route => {
    calls.push({ body: route.request().postDataJSON(), headers: await route.request().allHeaders() });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ text: '<img src=x onerror=alert(1)> Risposta', model: 'gemini-test' }) });
  });
  await page.goto(`${fixture.config.origin}/chat`);
  await page.getByLabel('La tua domanda').fill('Come organizzare la spesa?');
  await page.getByRole('button', { name: 'Invia domanda', exact: true }).click();
  await page.locator('.chat-model').waitFor();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, { message: 'Come organizzare la spesa?', history: [] });
  assert.ok(calls[0].headers['x-csrf-token']);
  assert.equal(await page.locator('.chat-model img').count(), 0);
  assert.match(await page.locator('.chat-model').textContent(), /<img src=x/);
  await page.getByLabel('La tua domanda').fill('E poi?');
  await page.getByRole('button', { name: 'Invia domanda', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.chat-model').length === 2);
  assert.deepEqual(calls[1].body.history.map(m => m.role), ['user', 'model']);
  assert.equal(await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)].some(key => /chat|gemini|conversation/i.test(key))), false);
  await page.getByRole('button', { name: 'Nuova conversazione' }).click();
  assert.equal(await page.locator('.chat-message').count(), 0);
  await page.reload();
  await page.getByLabel('La tua domanda').waitFor();
  assert.equal(await page.locator('.chat-message').count(), 0);
});

test('failed chat keeps the draft, requires a manual retry, and handles session expiry', async t => {
  const { fixture, context, page } = await setup(t);
  let calls = 0;
  await context.route('**/api/chat', route => {
    calls++;
    return route.fulfill({ status: calls === 1 ? 429 : 401, contentType: 'application/json', body: '{"error":"rate_limited"}' });
  });
  await page.goto(`${fixture.config.origin}/chat`);
  await page.getByLabel('La tua domanda').fill('Domanda da ritentare');
  await page.getByRole('button', { name: 'Invia domanda', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'limite temporaneo' }).waitFor();
  assert.equal(await page.getByLabel('La tua domanda').inputValue(), 'Domanda da ritentare');
  assert.equal(await page.locator('.chat-message').count(), 0);
  assert.equal(calls, 1);
  await page.getByRole('button', { name: 'Invia domanda', exact: true }).click();
  await page.waitForURL('**/login?error=expired');
  assert.equal(calls, 2);
});

test('chat prunes oldest complete turns to keep long responses inside the history budget', async t => {
  const { fixture, context, page } = await setup(t);
  const calls = [];
  const longReply = 'Risposta lunga '.repeat(1100);
  await context.route('**/api/chat', route => {
    calls.push(route.request().postDataJSON());
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ text: longReply, model: 'gemini-test' }) });
  });
  await page.goto(`${fixture.config.origin}/chat`);
  for (const [index, question] of ['Prima domanda', 'Seconda domanda', 'Terza domanda'].entries()) {
    await page.getByLabel('La tua domanda').fill(question);
    await page.getByRole('button', { name: 'Invia domanda', exact: true }).click();
    await page.waitForFunction(count => document.querySelectorAll('.chat-model').length === count, index + 1);
    await page.getByRole('button', { name: 'Invia domanda', exact: true }).waitFor({ state: 'visible' });
  }
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[2].history, [{ role: 'user', text: 'Seconda domanda' }, { role: 'model', text: longReply }]);
  assert.ok(calls[2].history.reduce((sum, entry) => sum + entry.text.length, calls[2].message.length) <= 24000);
});

test('provider overload explains the failure, preserves the draft and only retries manually', async t => {
  const { fixture, context, page } = await setup(t);
  let calls = 0;
  await context.route('**/api/chat', route => {
    calls++;
    return route.fulfill({ status: calls === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(calls === 1 ? { error: 'provider_unavailable', message: 'Private provider details' } : { text: 'Risposta dopo il tentativo manuale.' }) });
  });
  await page.goto(`${fixture.config.origin}/chat`);
  await page.getByLabel('La tua domanda').fill('Domanda conservata');
  await page.getByRole('button', { name: 'Invia domanda', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Gemini Flash è temporaneamente sovraccarico' }).waitFor();
  assert.equal(await page.getByLabel('La tua domanda').inputValue(), 'Domanda conservata');
  assert.equal(await page.locator('.chat-message').count(), 0);
  assert.equal(calls, 1);
  assert.equal(await page.getByText('Private provider details').count(), 0);
  await page.getByRole('button', { name: 'Invia domanda', exact: true }).click();
  await page.locator('.chat-model').filter({ hasText: 'Risposta dopo il tentativo manuale.' }).waitFor();
  assert.equal(calls, 2);
  assert.equal(await page.getByRole('alert').count(), 0);
  assert.equal(await page.getByLabel('La tua domanda').inputValue(), '');
});
