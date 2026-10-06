'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createGeminiService, MODEL } = require('../server/gemini.cjs');
const env = { GEMINI_ENABLED: 'true', GEMINI_API_KEY: 'test-private-key', GEMINI_ACCESS_MODE: 'local-dev' };
const good = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Risposta informativa.' }] } }] }) });
const service = overrides => createGeminiService({ env, origin: 'http://localhost:8080', fetchImpl: good, ...overrides });
test('disabled and public unpaid configuration never contact provider', async () => {
  for (const options of [{ env: {} }, { origin: 'https://nutriprobasta.jirachibot.eu' }, { env: { ...env, GEMINI_ACCESS_MODE: '' } }, { env: { ...env, GEMINI_MODEL: '../other' } }]) {
    let calls = 0;
    const app = service({ ...options, fetchImpl: async () => { calls++; } });
    assert.equal(app.status().enabled, false);
    assert.equal(JSON.stringify(app.status()).includes(env.GEMINI_API_KEY), false);
    await assert.rejects(app.generate('user', { message: 'Ciao' }), { status: 503 });
    assert.equal(calls, 0);
  }
  assert.equal(service({ origin: 'https://nutriprobasta.jirachibot.eu', env: { ...env, GEMINI_ACCESS_MODE: 'paid-services' } }).status().enabled, true);
});
test('transport keeps key in header and sends bounded Italian instruction and explicit messages only', async () => {
  let request;
  const app = service({ fetchImpl: async (url, options) => { request = { url, options }; return good(); } });
  assert.deepEqual(await app.generate('account', { message: ' Ciao ', history: [{ role: 'user', text: 'Prima' }, { role: 'model', text: 'Risposta' }] }), { text: 'Risposta informativa.', model: MODEL });
  assert.equal(request.url, `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`);
  assert.equal(request.url.includes(env.GEMINI_API_KEY), false);
  assert.equal(request.options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
  assert.equal(request.options.redirect, 'error');
  const payload = JSON.parse(request.options.body);
  assert.equal(payload.generationConfig.maxOutputTokens, 1024);
  assert.match(payload.systemInstruction.parts[0].text, /italiano/);
  assert.deepEqual(payload.contents.map(entry => entry.role), ['user', 'model', 'user']);
  assert.equal(payload.contents.at(-1).parts[0].text, 'Ciao');
  assert.equal(request.options.body.includes('account'), false);
});
test('invalid message, history and unsolicited plan never leave server', async () => {
  let calls = 0;
  const app = service({ fetchImpl: async () => { calls++; return good(); } });
  for (const body of [null, {}, { message: '' }, { message: 'x'.repeat(2001) }, { message: 'x', context: {} }, { message: 'x', history: [{ role: 'user', text: 'x' }] }, { message: 'x', history: [{ role: 'model', text: 'x' }, { role: 'user', text: 'x' }] }, { message: 'x', history: Array.from({ length: 22 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: 'x' })) }]) await assert.rejects(app.generate('user', body), { status: 400 });
  await assert.rejects(app.generate('', { message: 'x' }), { status: 401 });
  assert.equal(calls, 0);
});
test('minute, daily and global limits survive requests and expire only with clock', async () => {
  let time = 0;
  const app = service({ now: () => time });
  for (let i = 0; i < 5; i++) await app.generate('a', { message: 'x' });
  await assert.rejects(app.generate('a', { message: 'x' }), { status: 429 });
  for (let minute = 1; minute < 6; minute++) { time = minute * 60000; for (let i = 0; i < 5; i++) await app.generate('a', { message: 'x' }); }
  time += 60000;
  await assert.rejects(app.generate('a', { message: 'x' }), { status: 429 });
  for (let i = 0; i < 90; i++) await app.generate(`other-${i}`, { message: 'x' });
  await assert.rejects(app.generate('another', { message: 'x' }), { status: 429 });
  time = 86400000;
  assert.equal((await app.generate('a', { message: 'x' })).text, 'Risposta informativa.');
});
test('long model reply remains usable as history while user history and aggregate stay bounded', async () => {
  const app = service();
  const history = [{ role: 'user', text: 'Prima domanda' }, { role: 'model', text: 'x'.repeat(16000) }];
  assert.equal((await app.generate('user', { message: 'Seguito', history })).text, 'Risposta informativa.');
  await assert.rejects(app.generate('user', { message: 'Seguito', history: [{ role: 'user', text: 'x'.repeat(16000) }, { role: 'model', text: 'Risposta' }] }), { status: 400 });
  await assert.rejects(app.generate('user', { message: 'Seguito', history: [...history, ...history] }), { status: 400 });
});
test('four concurrent requests maximum; completion releases capacity', async () => {
  const releases = [];
  const app = service({ fetchImpl: () => new Promise(resolve => releases.push(() => resolve(good()))) });
  const pending = Array.from({ length: 4 }, (_, i) => app.generate(`u${i}`, { message: 'x' }));
  await assert.rejects(app.generate('next', { message: 'x' }), { status: 429 });
  releases.forEach(release => release());
  await Promise.all(pending);
});
test('timeout aborts transport without retry', async () => {
  let calls = 0;
  const app = service({ timeoutMs: 5, fetchImpl: (url, { signal }) => { calls++; return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('secret transport detail')))); } });
  await assert.rejects(app.generate('user', { message: 'x' }), { status: 504, code: 'timeout' });
  assert.equal(calls, 1);
});
test('provider errors, quota and safety blocks are sanitized', async () => {
  for (const [response, expected] of [[{ ok: false, status: 503 }, 503], [{ ok: false, status: 429 }, 429], [{ ok: false, status: 403 }, 502], [{ ok: true, json: async () => ({ promptFeedback: { blockReason: 'SAFETY' } }) }, 422], [{ ok: true, json: async () => ({ candidates: [{ finishReason: 'SAFETY', content: { parts: [{ text: 'blocked' }] } }] }) }, 422], [{ ok: true, json: async () => ({}) }, 502]]) {
    const app = service({ fetchImpl: async () => response });
    await assert.rejects(app.generate('user', { message: 'x' }), error => error.status === expected && !error.message.includes(env.GEMINI_API_KEY));
  }
  const app = service({ fetchImpl: async () => { throw new Error(env.GEMINI_API_KEY); } });
  await assert.rejects(app.generate('user', { message: 'x' }), error => error.status === 502 && !error.message.includes(env.GEMINI_API_KEY));
});
