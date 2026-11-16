'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startFixture } = require('./auth-fixture.cjs');
const { createLogger } = require('../server/log.cjs');

// The logger is the seam: a test sink replaces stdout, the server code is unchanged.
function sink() {
  const lines = [];
  return { lines, logger: createLogger({ level: 'info', write: line => lines.push(line) }), events: () => lines.map(line => JSON.parse(line)) };
}

test('every request is logged with method, path, status and duration, never the query string', async t => {
  const s = sink();
  const f = await startFixture({}, { logger: s.logger }); t.after(() => f.close());
  await f.request('/auth/google/callback?code=SECRET-CODE&state=SECRET-STATE');
  const entry = s.events().find(e => e.event === 'request' && e.path === '/auth/google/callback');
  assert.ok(entry, 'request line present');
  assert.equal(entry.method, 'GET');
  assert.equal(entry.status, 303);
  assert.equal(typeof entry.ms, 'number');
  assert.equal(s.lines.join('\n').includes('SECRET'), false);
});

test('a failed login logs the reason only, never identity or tokens', async t => {
  const s = sink();
  const f = await startFixture({}, { logger: s.logger }); t.after(() => f.close());
  f.rejectTokens();
  await f.login();
  const failed = s.events().find(e => e.event === 'login_failed');
  assert.equal(failed.reason, 'invalid_login');
  const all = s.lines.join('\n');
  for (const secret of ['test-code', 'test-id-token', 'manu@example.test', 'google-user-1']) assert.equal(all.includes(secret), false, secret);
});

test('a successful login is logged without who logged in', async t => {
  const s = sink();
  const f = await startFixture({}, { logger: s.logger }); t.after(() => f.close());
  await f.login();
  assert.ok(s.events().some(e => e.event === 'login_ok'));
  assert.equal(s.lines.join('\n').includes('manu@example.test'), false);
});

test('a database failure on the waitlist is logged with its code and without the applicant', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nutripro-log-'));
  const s = sink();
  const f = await startFixture({ WAITLIST_DB_PATH: path.join(dir, 'x', String.fromCharCode(0) + 'bad', 'w.sqlite') }, { logger: s.logger });
  t.after(async () => { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  const res = await f.request('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: f.config.origin },
    body: JSON.stringify({ name: 'Giulia Rossi', email: 'giulia@example.test', role: 'Dietista', privacy: true }) });
  assert.equal(res.status, 500);
  const entry = s.events().find(e => e.event === 'waitlist_db_error');
  assert.ok(entry && entry.code, 'error code logged');
  assert.equal(s.lines.join('\n').includes('giulia@example.test'), false);
});

test('level filters lines and silent writes nothing', () => {
  const out = [];
  const log = createLogger({ level: 'warn', write: line => out.push(line) });
  log.info('a'); log.warn('b'); log.error('c');
  assert.deepEqual(out.map(l => JSON.parse(l).event), ['b', 'c']);
  const none = [];
  createLogger({ level: 'silent', write: line => none.push(line) }).error('x');
  assert.equal(none.length, 0);
});

test('an unexpected error is logged by name and location, never by message', async t => {
  const s = sink();
  const broken = { generateAuthUrl() { throw new TypeError('internal detail with SECRET-VALUE'); } };
  const f = await startFixture({}, { logger: s.logger, oauthClient: broken }); t.after(() => f.close());
  assert.equal((await f.request('/auth/google')).status, 500);
  const entry = s.events().find(e => e.event === 'server_error');
  assert.equal(entry.name, 'TypeError');
  assert.match(entry.where, /^at /);
  assert.equal(s.lines.join('\n').includes('SECRET-VALUE'), false);
});
