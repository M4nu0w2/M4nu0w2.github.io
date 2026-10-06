'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configFromEnv } = require('../server/app.cjs');
const { startFixture } = require('./auth-fixture.cjs');

test('home and session fail closed; only explicit public assets are served', async t => {
  const f = await startFixture({ GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' });
  t.after(() => f.close());
  for (const route of ['/', '/index.html', '/?any=query', '/plans', '/plans/previous-plan']) {
    const r = await f.request(route);
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('location'), '/login');
    assert.ok(!(await r.text()).includes('meals-container'));
  }
  assert.equal((await f.request('/api/session')).status, 401);
  assert.equal((await f.request('/login')).status, 200);
  assert.deepEqual(await (await f.request('/auth/status')).json(), { configured: false });
  assert.equal((await f.request('/auth/google')).headers.get('location'), '/login?error=not_configured');
  for (const route of ['/.env', '/package.json', '/server/app.cjs', '/tests/auth.test.cjs', '/README.md', '/.wayfinder/TRACKER.md', '/.git/config', '/assets/../server/app.cjs', '/anything']) {
    assert.equal((await f.request(route)).status, 404, route);
  }
});

test('OIDC code flow uses state, nonce, PKCE and a server-only session; logout revokes it', async t => {
  const f = await startFixture(); t.after(() => f.close());
  const { response, cookie, start } = await f.login();
  assert.equal(start.url.origin, 'https://accounts.google.com');
  assert.equal(start.url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(start.url.searchParams.get('scope'), 'openid email profile');
  assert.equal(start.url.searchParams.get('access_type'), 'online');
  assert.ok(start.url.searchParams.get('nonce'));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/');
  const setCookie = response.headers.getSetCookie().find(s => s.startsWith('nutripro_session='));
  assert.match(setCookie, /HttpOnly; SameSite=Lax/);
  const headers = { Cookie: cookie };
  const sessionResponse = await f.request('/api/session', { headers });
  const session = await sessionResponse.json();
  assert.equal(session.sub, 'google-user-1');
  assert.equal(sessionResponse.headers.get('cache-control'), 'no-store');
  assert.ok(!JSON.stringify(session).includes('test-id-token'));
  assert.equal((await f.request('/', { headers })).status, 200);
  assert.equal((await f.request('/index.html', { headers })).status, 200);
  assert.equal((await f.request('/auth/logout', { headers })).status, 404);
  assert.equal((await f.request('/auth/logout', { method: 'POST', headers })).status, 403);
  assert.equal((await f.request('/auth/logout', { method: 'POST', headers: { ...headers, Origin: 'https://evil.test', 'X-CSRF-Token': session.csrf } })).status, 403);
  const logout = await f.request('/auth/logout', { method: 'POST', headers: { ...headers, Origin: f.config.origin, 'X-CSRF-Token': session.csrf } });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await f.request('/api/session', { headers })).status, 401);
  assert.equal((await f.request('/', { headers })).status, 303);
});

test('callback rejects CSRF, missing browser binding, replay and expired attempts', async t => {
  const f = await startFixture(); t.after(() => f.close());
  const first = await f.begin();
  const callback = `/auth/google/callback?code=test-code&state=${first.url.searchParams.get('state')}`;
  assert.equal((await f.request(callback)).headers.get('location'), '/login?error=invalid_login');
  assert.equal((await f.request('/auth/google/callback?code=test-code&state=wrong', { headers: { Cookie: first.cookie } })).headers.get('location'), '/login?error=invalid_login');
  assert.equal((await f.request(callback, { headers: { Cookie: first.cookie } })).headers.get('location'), '/login?error=invalid_login');
  const expired = await f.begin();
  f.advance(11 * 60000);
  assert.equal((await f.request(`/auth/google/callback?code=test-code&state=${expired.url.searchParams.get('state')}`, { headers: { Cookie: expired.cookie } })).headers.get('location'), '/login?error=invalid_login');
  const success = await f.login();
  assert.ok(success.cookie);
  assert.equal((await f.request(`/auth/google/callback?code=test-code&state=${success.start.url.searchParams.get('state')}`, { headers: { Cookie: success.start.cookie } })).headers.get('location'), '/login?error=invalid_login');
});

test('invalid Google identities, failed token verification and disallowed accounts never create sessions', async t => {
  for (const identity of [{ nonce: 'wrong' }, { email_verified: false }, { exp: 1 }, { aud: 'evil' }, { iss: 'evil' }, { sub: '' }]) {
    const f = await startFixture();
    try {
      f.setIdentity(identity);
      const result = await f.login();
      assert.equal(result.response.headers.get('location'), '/login?error=invalid_login');
      assert.equal(result.cookie, undefined);
    } finally { await f.close(); }
  }
  const rejected = await startFixture(); t.after(() => rejected.close());
  rejected.rejectTokens();
  assert.equal((await rejected.login()).cookie, undefined);
  const restricted = await startFixture({ ALLOWED_EMAILS: 'claudio@example.test' }); t.after(() => restricted.close());
  assert.equal((await restricted.login()).response.headers.get('location'), '/login?error=not_allowed');
});

test('sessions expire, fabricated cookies fail and successful login rotates the session', async t => {
  const f = await startFixture({ SESSION_TTL_SECONDS: '60' }); t.after(() => f.close());
  assert.equal((await f.request('/api/session', { headers: { Cookie: `nutripro_session=${'a'.repeat(43)}` } })).status, 401);
  const login = await f.login();
  f.advance(61000);
  assert.equal((await f.request('/api/session', { headers: { Cookie: login.cookie } })).status, 401);
  const first = await f.login();
  const next = await f.begin();
  const rotated = await f.request(`/auth/google/callback?code=test-code&state=${next.url.searchParams.get('state')}`, { headers: { Cookie: `${next.cookie}; ${first.cookie}` } });
  assert.equal(rotated.status, 303);
  assert.equal((await f.request('/api/session', { headers: { Cookie: first.cookie } })).status, 401);
});

test('production requires HTTPS, sets host-only Secure cookies, and uses a fixed callback origin', async t => {
  assert.throws(() => configFromEnv({ APP_ORIGIN: 'http://example.test' }), /HTTPS/);
  assert.throws(() => configFromEnv({ APP_ORIGIN: 'https://example.test/path' }), /origin/);
  assert.throws(() => configFromEnv({ GOOGLE_CLIENT_ID: 'id' }), /both/);
  const f = await startFixture(); t.after(() => f.close());
  // Names are chosen when creating a server, so also inspect the actual production config below.
  const { createAuthServer } = require('../server/app.cjs');
  const config = configFromEnv({ APP_ORIGIN: 'https://nutriprobasta.jirachibot.eu', GOOGLE_CLIENT_ID: 'test.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'test' });
  const server = createAuthServer(config, { oauthClient: { generateAuthUrl: () => 'https://accounts.google.com/' } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const r = await fetch(`http://127.0.0.1:${server.address().port}/auth/google`, { redirect: 'manual', headers: { Host: 'evil.test', 'X-Forwarded-Host': 'evil.test' } });
  assert.match(r.headers.get('set-cookie'), /^__Host-nutripro_oauth=.*; Path=\/; HttpOnly; SameSite=Lax; Max-Age=600; Secure$/);
  const start = await f.begin();
  assert.equal(start.url.searchParams.get('redirect_uri'), `${f.config.origin}/auth/google/callback`);
});

test('login initiation rate limits expire and cannot be bypassed using an untrusted IP header', async t => {
  const f = await startFixture(); t.after(() => f.close());
  for (let i = 0; i < 20; i++) {
    const response = await f.request('/auth/google', { headers: { 'X-Real-IP': `192.0.2.${i + 1}` } });
    assert.equal(new URL(response.headers.get('location')).hostname, 'accounts.google.com');
  }
  const limited = await f.request('/auth/google');
  assert.equal(limited.headers.get('location'), '/login?error=too_many_attempts');
  assert.equal(limited.headers.get('retry-after'), '60');
  f.advance(61000);
  assert.equal(new URL((await f.request('/auth/google')).headers.get('location')).hostname, 'accounts.google.com');
  const proxied = await startFixture({ TRUST_PROXY: 'true' }); t.after(() => proxied.close());
  for (let i = 0; i < 125; i++) await proxied.request('/auth/google', { headers: { 'X-Real-IP': '192.0.2.1' } });
  const otherUser = await proxied.request('/auth/google', { headers: { 'X-Real-IP': '192.0.2.2' } });
  assert.equal(new URL(otherUser.headers.get('location')).hostname, 'accounts.google.com');
});

test('real Google verifier validates RSA signatures; rejects forged signatures, issuer, audience and expired JWT', async t => {
  const crypto = require('node:crypto');
  const { OAuth2Client } = require('google-auth-library');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const verifier = new OAuth2Client('test.apps.googleusercontent.com');
  verifier.getFederatedSignonCertsAsync = async () => ({ certs: { local: publicKey.export({ type: 'spki', format: 'pem' }) } });
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: 'google-user-1', email: 'manu@example.test', email_verified: true,
    iss: 'https://accounts.google.com', aud: 'test.apps.googleusercontent.com', iat: now, exp: now + 3600, nonce: 'test-nonce' };
  function jwt(payload, key = privateKey) {
    const data = [JSON.stringify({ alg: 'RS256', kid: 'local' }), JSON.stringify(payload)].map(v => Buffer.from(v).toString('base64url')).join('.');
    return `${data}.${crypto.sign('RSA-SHA256', Buffer.from(data), key).toString('base64url')}`;
  }
  const valid = await verifier.verifyIdToken({ idToken: jwt(claims), audience: claims.aud });
  assert.equal(valid.getPayload().sub, claims.sub);
  const wrongKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  await assert.rejects(verifier.verifyIdToken({ idToken: jwt(claims, wrongKey), audience: claims.aud }));
  for (const change of [{ aud: 'evil' }, { iss: 'evil' }, { iat: now - 7200, exp: now - 3600 }]) {
    await assert.rejects(verifier.verifyIdToken({ idToken: jwt({ ...claims, ...change }), audience: claims.aud }));
  }
});
