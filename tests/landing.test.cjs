'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startFixture } = require('./auth-fixture.cjs');

function tempEnv(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nutripro-landing-'));
  const landing = path.join(dir, 'landing');
  fs.mkdirSync(path.join(landing, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(landing, 'privacy'));
  fs.writeFileSync(path.join(landing, 'index.html'), '<!doctype html><title>Landing</title>');
  fs.writeFileSync(path.join(landing, 'privacy', 'index.html'), '<!doctype html><title>Privacy</title>');
  fs.writeFileSync(path.join(landing, 'assets', 'main-abc.js'), 'void 0');
  fs.writeFileSync(path.join(landing, 'robots.txt'), 'User-agent: *');
  fs.writeFileSync(path.join(landing, 'secret.env'), 'TOKEN=1');
  return { dir, LANDING_DIR: landing, WAITLIST_DB_PATH: path.join(dir, 'data', 'waitlist.sqlite') };
}

// Closes the server (and its SQLite file) before the temp folder is removed: Windows refuses to delete an open file.
async function start(t, overrides = {}) {
  const { dir, ...env } = tempEnv(t);
  const f = await startFixture({ ...env, ...overrides });
  t.after(async () => { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { f, env };
}

const valid = { name: 'Giulia Rossi', email: 'Giulia@Example.test', role: 'Nutrizionista', patients: '40', privacy: true };
const post = (f, body, headers = {}) => f.request('/api/waitlist', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: f.config.origin, ...headers }, body: JSON.stringify(body) });

test('root serves the public landing without a session; the app lives under /app', async t => {
  const { f } = await start(t);
  const home = await f.request('/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Landing/);
  assert.match(home.headers.get('content-security-policy'), /fonts\.googleapis\.com/);
  assert.equal((await f.request('/privacy/')).status, 200);
  assert.equal((await f.request('/privacy')).headers.get('location'), '/privacy/');
  assert.equal((await f.request('/robots.txt')).status, 200);
  assert.match((await f.request('/assets/main-abc.js')).headers.get('cache-control'), /immutable/);
  assert.equal((await f.request('/secret.env')).status, 404);
  assert.equal((await f.request('/app/')).headers.get('location'), '/app/login');
  assert.equal((await f.request('/app')).headers.get('location'), '/app/');
  // The authenticated app keeps its own strict CSP, without external origins.
  assert.doesNotMatch((await f.request('/app/login')).headers.get('content-security-policy'), /googleapis/);
});

test('bookmarks to the old app paths redirect under /app', async t => {
  const { f } = await start(t);
  for (const [from, to] of [['/login', '/app/login'], ['/plans', '/app/plans'], ['/plans/abc', '/app/plans/abc'], ['/chat', '/app/chat'], ['/settings', '/app/settings'], ['/index.html', '/app/']]) {
    const r = await f.request(from);
    assert.equal(r.status, 303, from);
    assert.equal(r.headers.get('location'), to, from);
  }
});

test('waitlist stores a normalized application once and never reveals duplicates', async t => {
  const { f, env } = await start(t);
  assert.equal((await post(f, valid)).status, 200);
  assert.equal((await post(f, { ...valid, name: 'Altro' })).status, 200);
  await f.close();
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(env.WAITLIST_DB_PATH);
  const rows = db.prepare('SELECT name, email, role, patients FROM waitlist').all();
  db.close();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'giulia@example.test');
  assert.equal(rows[0].patients, 40);
});

test('waitlist validates input, origin, method, honeypot and rate', async t => {
  const { f } = await start(t);
  const bad = await post(f, { ...valid, email: 'no', role: 'Altro ruolo', privacy: false });
  assert.equal(bad.status, 422);
  const errors = (await bad.json()).errors;
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'privacy', 'role']);
  assert.equal((await post(f, valid, { Origin: 'https://evil.test' })).status, 403);
  assert.equal((await f.request('/api/waitlist')).status, 405);
  assert.equal((await post(f, { ...valid, website: 'http://spam.test' })).status, 200);
  const form = await f.request('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: f.config.origin },
    body: new URLSearchParams({ name: 'Luca', email: 'luca@example.test', role: 'Dietista', privacy: 'on' }).toString() });
  assert.equal(form.status, 303);
  assert.equal(form.headers.get('location'), '/?waitlist=ok#tester');
  let last;
  for (let i = 0; i < 6; i++) last = await post(f, valid);
  assert.equal(last.status, 429);
});

test('a missing database volume fails only the waitlist, not the app', async t => {
  const { f } = await start(t, { WAITLIST_DB_PATH: path.join(os.tmpdir(), 'nutripro-missing', '\0bad', 'w.sqlite') });
  assert.equal((await post(f, valid)).status, 500);
  assert.equal((await f.request('/healthz')).status, 200);
});

function mailEnv(t) {
  const { dir, ...env } = tempEnv(t);
  return { dir, env: { ...env, SMTP_HOST: 'smtp.example.test', WAITLIST_NOTIFY_TO: 'info@nutra.example.test' } };
}

test('a new waitlist entry sends one summary mail; duplicates and honeypot do not', async t => {
  const { dir, env } = mailEnv(t);
  const sent = [];
  let notified;
  const gotMail = new Promise(resolve => { notified = resolve; });
  const transport = { async sendMail(message) { sent.push(message); notified(); } };
  const f = await startFixture(env, { mailTransport: transport });
  t.after(async () => { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  assert.equal((await post(f, valid)).status, 200);
  await gotMail;
  assert.equal((await post(f, valid)).status, 200);
  assert.equal((await post(f, { ...valid, email: 'bot@example.test', website: 'http://spam.test' })).status, 200);
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'info@nutra.example.test');
  assert.equal(sent[0].replyTo, 'giulia@example.test');
  assert.doesNotMatch(sent[0].subject, /Giulia/);
  assert.match(sent[0].text, /Giulia Rossi/);
  assert.match(sent[0].text, /Nutrizionista/);
});

test('a failing mail transport never fails the waitlist reply', async t => {
  const { dir, env } = mailEnv(t);
  const transport = { async sendMail() { throw Object.assign(new Error('connect refused'), { code: 'ECONNREFUSED' }); } };
  const f = await startFixture(env, { mailTransport: transport });
  t.after(async () => { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  assert.equal((await post(f, valid)).status, 200);
});

test('mail settings are validated and optional', () => {
  const { mailConfigFromEnv } = require('../server/mailer.cjs');
  assert.equal(mailConfigFromEnv({}), null);
  assert.throws(() => mailConfigFromEnv({ SMTP_HOST: 'h' }), /both SMTP_HOST and WAITLIST_NOTIFY_TO/);
  assert.throws(() => mailConfigFromEnv({ SMTP_HOST: 'h', WAITLIST_NOTIFY_TO: 'no' }), /Invalid WAITLIST_NOTIFY_TO/);
  assert.throws(() => mailConfigFromEnv({ SMTP_HOST: 'h', WAITLIST_NOTIFY_TO: 'a@b.it', SMTP_USER: 'u' }), /SMTP_USER and SMTP_PASS/);
  assert.throws(() => mailConfigFromEnv({ SMTP_HOST: 'h', WAITLIST_NOTIFY_TO: 'a@b.it', SMTP_PORT: '0' }), /Invalid SMTP_PORT/);
  const c = mailConfigFromEnv({ SMTP_HOST: 'h', WAITLIST_NOTIFY_TO: 'a@b.it' });
  assert.deepEqual([c.port, c.secure, c.from], [587, false, 'a@b.it']);
});
