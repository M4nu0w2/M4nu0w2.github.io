'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');

async function setup(t, overrides = {}) {
  const fixture = await startFixture(overrides);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  await context.route(`${fixture.config.origin}/auth/google`, async route => {
    const start = await fixture.begin();
    return route.fulfill({ status: 303, headers: {
      'Set-Cookie': start.response.headers.get('set-cookie'),
      Location: `${fixture.config.origin}/auth/google/callback?code=test-code&state=${start.url.searchParams.get('state')}`
    }, body: '' });
  });
  await context.route('https://**/*', async route => {
    const url = new URL(route.request().url());
    return route.fulfill({ status: 200, contentType: url.pathname.endsWith('.js') ? 'application/javascript' : 'text/css', body: '' });
  });
  t.after(async () => { await browser.close(); await fixture.close(); });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', e => window.cspViolations.push(e.violatedDirective));
  });
  return { fixture, browser, context, page, errors };
}

test('Google login redirect, protected home, logout and browser back with mobile/desktop layouts', async t => {
  const { fixture, context, page, errors } = await setup(t);
  await page.goto(fixture.config.origin);
  assert.equal(new URL(page.url()).pathname, '/login');
  assert.equal(await page.locator('#main-content').count(), 0);
  await page.getByRole('link', { name: 'Accedi con Google' }).waitFor();
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(os.tmpdir(), 'nutripro-login-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: 'Accedi con Google' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Carica il tuo PDF', exact: true }).click();
  await page.getByRole('button', { name: /Carica Piano di Prova Progeo/i }).click();
  await page.getByRole('button', { name: 'Importa e attiva', exact: true }).click();
  assert.equal(await page.locator('#account-name').textContent(), 'Manu');
  assert.equal(await page.locator('#main-content').isVisible(), true);
  assert.ok(await page.evaluate(() => localStorage.getItem('diet_plan_archive:google-user-1')));
  assert.equal(await page.evaluate(() => Object.keys(localStorage).some(k => /token|session/i.test(k))), false);
  const cookies = await context.cookies();
  assert.ok(cookies.find(c => c.name === 'nutripro_session').httpOnly);
  await page.screenshot({ path: path.join(os.tmpdir(), 'nutripro-auth-home-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Esci', exact: true }).filter({ visible: true }).first().click();
  await page.waitForURL('**/login');
  assert.equal((await context.request.get(`${fixture.config.origin}/api/session`)).status(), 401);
  await page.goBack();
  await page.waitForURL('**/login*');
  assert.equal(await page.locator('#main-content').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
});

test('different Google accounts use separate local plans; legacy unowned storage remains untouched', async t => {
  const { fixture, context, page } = await setup(t);
  await page.goto(`${fixture.config.origin}/login`);
  await page.evaluate(() => localStorage.setItem('diet_plan_data', 'legacy-unowned-plan'));
  await page.getByRole('link', { name: 'Accedi con Google' }).click();
  await page.getByRole('button', { name: 'Carica il tuo PDF', exact: true }).click();
  await page.getByRole('button', { name: /Carica Piano di Prova Progeo/i }).click();
  await page.getByRole('button', { name: 'Importa e attiva', exact: true }).click();
  const firstPlan = await page.evaluate(() => localStorage.getItem('diet_plan_archive:google-user-1'));
  await page.getByRole('button', { name: 'Esci', exact: true }).filter({ visible: true }).first().click();
  await page.waitForURL('**/login');
  fixture.setIdentity({ sub: 'google-user-2', name: 'Claudio', email: 'claudio@example.test' });
  await page.getByRole('link', { name: 'Accedi con Google' }).click();
  await page.getByRole('button', { name: 'Carica il tuo PDF', exact: true }).waitFor();
  assert.equal(await page.locator('#account-name').textContent(), 'Claudio');
  assert.equal(await page.locator('#upload-overlay').isVisible(), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('diet_plan_archive:google-user-2')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('diet_plan_archive:google-user-1')), firstPlan);
  assert.equal(await page.evaluate(() => localStorage.getItem('diet_plan_data')), 'legacy-unowned-plan');
  // Revocation also protects previously opened tabs when reloaded.
  const other = await context.newPage();
  await other.goto(fixture.config.origin);
  await other.locator('#account-name').filter({ hasText: 'Claudio' }).waitFor();
  await page.bringToFront();
  await page.getByRole('button', { name: 'Esci', exact: true }).filter({ visible: true }).first().click();
  await page.waitForURL('**/login');
  await other.reload();
  assert.equal(new URL(other.url()).pathname, '/login');
});

test('missing credentials and unavailable session API never initialize the home', async t => {
  const { fixture, page } = await setup(t, { GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' });
  await page.goto(fixture.config.origin);
  await page.getByRole('status').filter({ hasText: 'Accesso Google non ancora disponibile.' }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Accedi con Google' }).isVisible(), false);
  assert.equal(await page.getByRole('button', { name: 'Riprova' }).isVisible(), true);
  assert.equal(await page.locator('#main-content').count(), 0);
  // A static-host mirror must also stay locked if it has no session backend.
  const html = require('node:fs').readFileSync('dist/index.html', 'utf8');
  await page.route(`${fixture.config.origin}/`, route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.route('**/api/session', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"unauthenticated"}' }));
  await page.goto(fixture.config.origin);
  await page.waitForURL('**/login?error=expired');
  assert.equal(await page.locator('#main-content').count(), 0);
});
