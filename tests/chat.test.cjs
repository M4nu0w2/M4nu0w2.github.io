const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startFixture } = require('./auth-fixture.cjs');

async function setup(t, service) {
  const fixture = await startFixture({}, service ? { geminiService: service } : {});
  t.after(() => fixture.close());
  const login = await fixture.login();
  const session = await (await fixture.request('/api/session', { headers: { Cookie: login.cookie } })).json();
  const headers = { Cookie: login.cookie, Origin: fixture.config.origin, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' };
  return { fixture, headers, session };
}

test('chat page and APIs require session; configured disabled service makes no provider calls', async t => {
  const { fixture, headers } = await setup(t);
  assert.equal((await fixture.request('/chat')).status, 303);
  assert.equal((await fixture.request('/api/chat/status')).status, 401);
  assert.equal((await fixture.request('/api/chat', { method: 'POST' })).status, 401);
  const status = await fixture.request('/api/chat/status', { headers });
  assert.equal((await status.json()).enabled, false);
  const send = await fixture.request('/api/chat', { method: 'POST', headers, body: JSON.stringify({ message: 'Ciao' }) });
  assert.equal(send.status, 503);
  assert.equal((await send.json()).error, 'unavailable');
});

test('chat enforces Origin and CSRF before generation and passes server identity only', async t => {
  const calls = [];
  const service = { status: () => ({ enabled: true }), generate: async (...args) => { calls.push(args); return { text: 'Risposta', model: 'test' }; } };
  const { fixture, headers, session } = await setup(t, service);
  for (const changes of [{ Origin: 'https://evil.test' }, { 'X-CSRF-Token': '' }]) {
    const response = await fixture.request('/api/chat', { method: 'POST', headers: { ...headers, ...changes }, body: '{"message":"Ciao"}' });
    assert.equal(response.status, 403);
  }
  assert.equal(calls.length, 0);
  const response = await fixture.request('/api/chat', { method: 'POST', headers, body: '{"message":"Ciao","history":[]}' });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [[session.sub, { message: 'Ciao', history: [] }]]);
});

test('bounded JSON and content type validation stop malformed requests before generation', async t => {
  let count = 0;
  const service = { status: () => ({ enabled: true }), generate: async () => { count++; return {}; } };
  const { fixture, headers } = await setup(t, service);
  for (const [type, body, status] of [['text/plain', '{}', 415], ['application/json', '{', 400], ['application/json', JSON.stringify({ message: 'x'.repeat(140000) }), 413]]) {
    const response = await fixture.request('/api/chat', { method: 'POST', headers: { ...headers, 'Content-Type': type }, body });
    assert.equal(response.status, status);
  }
  assert.equal(count, 0);
});

test('unexpected provider failures cannot leak raw messages; quota has safe retry response', async t => {
  let quota = false;
  const service = { status: () => ({ enabled: true }), generate: async () => {
    if (quota) throw Object.assign(new Error('raw provider private'), { status: 429, code: 'provider_quota', safeMessage: 'Quota esaurita.' });
    throw new Error('raw secret-key and transcript');
  } };
  const { fixture, headers } = await setup(t, service);
  const request = () => fixture.request('/api/chat', { method: 'POST', headers, body: '{"message":"Ciao"}' });
  let response = await request();
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /raw|secret-key|transcript/);
  quota = true; response = await request();
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal((await response.json()).message, 'Quota esaurita.');
});

test('upstream overload reaches the client as a distinct safe error without retry', async t => {
  const { createGeminiService } = require('../server/gemini.cjs');
  let attempts = 0;
  const service = createGeminiService({
    env: { GEMINI_API_KEY: 'test-private-key', GEMINI_ENABLED: 'true', GEMINI_ACCESS_MODE: 'local-dev' },
    origin: 'http://localhost:8080',
    fetchImpl: async () => { attempts++; return { status: 503, ok: false }; }
  });
  const { fixture, headers } = await setup(t, service);
  const response = await fixture.request('/api/chat', { method: 'POST', headers, body: '{"message":"Ciao"}' });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, 'provider_unavailable');
  assert.match(body.message, /sovraccarico/);
  assert.doesNotMatch(JSON.stringify(body), /test-private-key/);
  assert.equal(attempts, 1);
});
