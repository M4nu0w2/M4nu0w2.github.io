'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isIP } = require('node:net');
const { OAuth2Client } = require('google-auth-library');

const ROOT = path.join(__dirname, '..', 'dist');
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'";
const random = () => crypto.randomBytes(32).toString('base64url');
const digest = value => crypto.createHash('sha256').update(value).digest('base64url');
const equal = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

function configFromEnv(env) {
  const origin = new URL(env.APP_ORIGIN || 'http://localhost:8080');
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash ||
      !['https:', 'http:'].includes(origin.protocol)) throw new Error('APP_ORIGIN must be an absolute origin without path');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if (origin.protocol !== 'https:' && !local) throw new Error('APP_ORIGIN requires HTTPS outside localhost');
  const port = Number(env.PORT || 8080);
  const sessionTtl = Number(env.SESSION_TTL_SECONDS || 43200) * 1000;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
  if (!Number.isSafeInteger(sessionTtl) || sessionTtl < 60000 || sessionTtl > 7 * 86400000) throw new Error('Invalid session duration');
  const clientId = (env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (env.GOOGLE_CLIENT_SECRET || '').trim();
  if (Boolean(clientId) !== Boolean(clientSecret)) throw new Error('Configure both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  if (clientId && !clientId.endsWith('.apps.googleusercontent.com')) throw new Error('Invalid Google OAuth client ID');
  return {
    origin: origin.origin, port, secure: origin.protocol === 'https:', clientId, clientSecret,
    ready: Boolean(clientId && clientSecret), sessionTtl, flowTtl: 10 * 60000,
    allowedEmails: (env.ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    deploySha: /^[a-f0-9]{40}$/.test(env.NUTRIPRO_SHA || '') ? env.NUTRIPRO_SHA : 'unknown',
    trustProxy: env.TRUST_PROXY === 'true'
  };
}

function cookies(req) {
  const result = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) result[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return result;
}

// The OAuth client and clock can be injected by tests only. Production always uses Google's verifier.
function createAuthServer(config, { oauthClient, now = Date.now } = {}) {
  const client = oauthClient || new OAuth2Client({ clientId: config.clientId, clientSecret: config.clientSecret,
    redirectUri: `${config.origin}/auth/google/callback`,
    transporterOptions: { timeout: 10000, retryConfig: { retry: 0 } } });
  const sessions = new Map();
  const flows = new Map();
  const attempts = new Map();
  let totalAttempts = { count: 0, expires: 0 };
  let activeCallbacks = 0;
  const sessionName = config.secure ? '__Host-nutripro_session' : 'nutripro_session';
  const flowName = config.secure ? '__Host-nutripro_oauth' : 'nutripro_oauth';
  const shell = fs.readFileSync(path.join(ROOT, 'index.html'));
  const files = new Map([
    ['/icon-512.png', { file: path.join(ROOT, 'icon-512.png'), type: 'image/png' }],
    ['/manifest.webmanifest', { file: path.join(ROOT, 'manifest.webmanifest'), type: 'application/manifest+json' }],
  ]);
  for (const name of fs.readdirSync(path.join(ROOT, 'assets'))) {
    if (!/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*\.(js|mjs|css|woff2|png|svg)$/.test(name)) continue;
    const type = { '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(name)];
    files.set(`/assets/${name}`, { file: path.join(ROOT, 'assets', name), type });
  }
  const cookie = (name, value, ttl) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ttl / 1000)}${config.secure ? '; Secure' : ''}`;
  function prune() {
    for (const collection of [sessions, flows, attempts]) {
      for (const [key, item] of collection) if (item.expires <= now()) collection.delete(key);
    }
  }
  const sweep = setInterval(prune, 60000);
  sweep.unref();
  function sessionFor(req) {
    const id = cookies(req)[sessionName];
    if (!id || !/^[\w-]{43}$/.test(id)) return null;
    const session = sessions.get(digest(id));
    if (!session || session.expires <= now()) { sessions.delete(digest(id)); return null; }
    return session;
  }
  function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  }
  function redirect(res, location) { res.writeHead(303, { Location: location }); res.end(); }
  function loginError(res, error) { redirect(res, `/login?error=${error}`); }
  function allowLogin(req) {
    const forwarded = req.headers['x-real-ip'];
    // Enable only behind a proxy which overwrites X-Real-IP, never on a public port.
    const ip = config.trustProxy && typeof forwarded === 'string' && isIP(forwarded) ? forwarded : req.socket.remoteAddress;
    if (totalAttempts.expires <= now()) totalAttempts = { count: 0, expires: now() + 60000 };
    let bucket = attempts.get(ip);
    if (!bucket || bucket.expires <= now()) {
      if (attempts.size >= 2048) prune();
      if (attempts.size >= 2048) return false;
      bucket = { count: 0, expires: now() + 60000 };
      attempts.set(ip, bucket);
    }
    if (bucket.count >= 20 || totalAttempts.count >= 120) return false;
    bucket.count++;
    totalAttempts.count++;
    return true;
  }
  const server = http.createServer({ maxHeaderSize: 16384, requestTimeout: 15000, headersTimeout: 10000 }, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', CSP);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    try {
      const url = new URL(req.url, config.origin);
      // No redirects or callback URLs are ever derived from Host / forwarded headers.
      const route = url.pathname;
      if (route === '/healthz' && req.method === 'GET') return json(res, 200, { status: 'ok', loginConfigured: config.ready });
      if (route === '/deploy-version.txt' && ['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(req.method === 'HEAD' ? undefined : `${config.deploySha}\n`);
      }
      if (route === '/auth/status' && req.method === 'GET') return json(res, 200, { configured: config.ready });
      if (route === '/auth/google' && req.method === 'GET') {
        if (!config.ready) return loginError(res, 'not_configured');
        if (!allowLogin(req)) {
          res.setHeader('Retry-After', '60');
          return loginError(res, 'too_many_attempts');
        }
        prune();
        if (flows.size >= 1000) return json(res, 503, { error: 'busy' });
        const previous = cookies(req)[flowName];
        if (previous) flows.delete(digest(previous));
        const browserId = random();
        const state = random();
        const nonce = random();
        const verifier = random();
        flows.set(digest(browserId), { state, nonce, verifier, expires: now() + config.flowTtl });
        res.setHeader('Set-Cookie', cookie(flowName, browserId, config.flowTtl));
        return redirect(res, client.generateAuthUrl({
          access_type: 'online', scope: ['openid', 'email', 'profile'], prompt: 'select_account',
          state, nonce, code_challenge: digest(verifier), code_challenge_method: 'S256'
        }));
      }
      if (route === '/auth/google/callback' && req.method === 'GET') {
        if (!config.ready) return loginError(res, 'not_configured');
        const browserId = cookies(req)[flowName];
        const flowKey = browserId ? digest(browserId) : '';
        const flow = flows.get(flowKey);
        flows.delete(flowKey); // Each attempt is single-use, including errors.
        res.setHeader('Set-Cookie', cookie(flowName, '', 0));
        if (!flow || flow.expires <= now() || !equal(flow.state, url.searchParams.get('state')) ||
            url.searchParams.getAll('state').length !== 1) return loginError(res, 'invalid_login');
        if (url.searchParams.has('error')) return loginError(res, 'cancelled');
        const code = url.searchParams.get('code');
        if (!code || code.length > 4096 || url.searchParams.getAll('code').length !== 1) return loginError(res, 'invalid_login');
        if (activeCallbacks >= 16) return loginError(res, 'too_many_attempts');
        activeCallbacks++;
        try {
          const { tokens } = await client.getToken({ code, codeVerifier: flow.verifier,
            redirect_uri: `${config.origin}/auth/google/callback` });
          if (!tokens.id_token) throw new Error('Missing ID token');
          const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.clientId });
          const identity = ticket.getPayload();
          // Signature, expiry, audience and issuer are checked by the Google library.
          // Explicit checks also bind this result to this exact login attempt.
          if (!identity || !equal(identity.nonce, flow.nonce) || identity.email_verified !== true ||
              typeof identity.sub !== 'string' || !/^[a-zA-Z0-9_-]{1,255}$/.test(identity.sub) ||
              typeof identity.email !== 'string' || identity.aud !== config.clientId ||
              !['accounts.google.com', 'https://accounts.google.com'].includes(identity.iss) ||
              !Number.isFinite(identity.exp) || identity.exp * 1000 <= now()) throw new Error('Invalid identity');
          if (config.allowedEmails.length && !config.allowedEmails.includes(identity.email.toLowerCase())) return loginError(res, 'not_allowed');
          prune();
          if (sessions.size >= 10000) return json(res, 503, { error: 'busy' });
          const oldId = cookies(req)[sessionName];
          if (oldId) sessions.delete(digest(oldId));
          const sessionId = random();
          sessions.set(digest(sessionId), { sub: identity.sub, email: identity.email,
            name: typeof identity.name === 'string' ? identity.name.slice(0, 200) : identity.email,
            csrf: random(), expires: now() + config.sessionTtl });
          res.setHeader('Set-Cookie', [cookie(flowName, '', 0), cookie(sessionName, sessionId, config.sessionTtl)]);
          return redirect(res, '/');
        } catch {
          // Do not log provider responses, codes, tokens or personal data.
          return loginError(res, 'invalid_login');
        } finally {
          activeCallbacks--;
        }
      }
      const session = sessionFor(req);
      if (route === '/api/session' && req.method === 'GET') {
        if (!session) return json(res, 401, { error: 'unauthenticated' });
        return json(res, 200, { sub: session.sub, name: session.name, email: session.email,
          csrf: session.csrf, expiresAt: session.expires });
      }
      if (route === '/auth/logout' && req.method === 'POST') {
        if (!session) return json(res, 401, { error: 'unauthenticated' });
        if (req.headers.origin !== config.origin || !equal(session.csrf, req.headers['x-csrf-token'])) return json(res, 403, { error: 'forbidden' });
        sessions.delete(digest(cookies(req)[sessionName]));
        res.setHeader('Set-Cookie', cookie(sessionName, '', 0));
        res.setHeader('Clear-Site-Data', '"cache"');
        return json(res, 200, { ok: true });
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'method_not_allowed' });
      const appRoute = route === '/' || route === '/index.html' || route === '/plans' || /^\/plans\/[a-zA-Z0-9_-]+$/.test(route);
      if (appRoute && !session) return redirect(res, '/login');
      if (appRoute || route === '/login') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(req.method === 'HEAD' ? undefined : shell);
      }
      const file = files.get(route);
      if (!file) return json(res, 404, { error: 'not_found' });
      res.writeHead(200, { 'Content-Type': file.type });
      return res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(file.file));
    } catch {
      return json(res, 500, { error: 'server_error' });
    }
  });
  server.on('close', () => clearInterval(sweep));
  return server;
}

module.exports = { createAuthServer, configFromEnv, CSP };
