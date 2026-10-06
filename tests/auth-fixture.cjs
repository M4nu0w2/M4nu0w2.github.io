'use strict';
const { OAuth2Client } = require('google-auth-library');
const { createAuthServer, configFromEnv } = require('../server/app.cjs');

// A simulated Google provider used only by local automated tests. Never a server route.
async function startFixture(overrides = {}, options = {}) {
  const config = configFromEnv({ APP_ORIGIN: 'http://127.0.0.1:8080', PORT: '0',
    GOOGLE_CLIENT_ID: 'test.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'test-only', ...overrides });
  let clock = Date.now();
  let pending;
  let nextIdentity = {};
  let rejectToken = false;
  const oauth = {
    generateAuthUrl(params) {
      pending = params;
      return new OAuth2Client(config.clientId, 'test-only', `${config.origin}/auth/google/callback`).generateAuthUrl(params);
    },
    async getToken({ code, codeVerifier, redirect_uri }) {
      if (code !== 'test-code' || redirect_uri !== `${config.origin}/auth/google/callback`) throw new Error('bad code');
      const crypto = require('node:crypto');
      if (crypto.createHash('sha256').update(codeVerifier).digest('base64url') !== pending.code_challenge) throw new Error('bad PKCE');
      return { tokens: { id_token: 'test-id-token' } };
    },
    async verifyIdToken({ audience }) {
      if (rejectToken || audience !== config.clientId) throw new Error('Invalid token');
      return { getPayload: () => ({ sub: 'google-user-1', email: 'manu@example.test', name: 'Manu',
        email_verified: true, iss: 'https://accounts.google.com', aud: config.clientId,
        exp: Math.floor(clock / 1000) + 3600, nonce: pending.nonce, ...nextIdentity }) };
    }
  };
  const server = createAuthServer(config, { oauthClient: oauth, now: () => clock, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  config.origin = `http://127.0.0.1:${server.address().port}`;
  return {
    server, config, oauth,
    setIdentity(value) { nextIdentity = value; },
    rejectTokens() { rejectToken = true; },
    advance(ms) { clock += ms; },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
    async request(route, options = {}) { return fetch(config.origin + route, { redirect: 'manual', ...options }); },
    async begin() {
      const response = await this.request('/auth/google');
      return { response, url: new URL(response.headers.get('location')), cookie: response.headers.get('set-cookie').split(';')[0] };
    },
    async login() {
      const start = await this.begin();
      const response = await this.request(`/auth/google/callback?state=${start.url.searchParams.get('state')}&code=test-code`, { headers: { Cookie: start.cookie } });
      const sessionCookie = response.headers.getSetCookie().find(s => s.startsWith('nutripro_session='));
      return { response, cookie: sessionCookie?.split(';')[0], start };
    }
  };
}
module.exports = { startFixture };
