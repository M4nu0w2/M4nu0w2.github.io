'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startFixture } = require('./auth-fixture.cjs');

const TODAY = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'][new Date().getDay()];
const PLAN = { days: { [TODAY]: { dayName: 'Oggi', meals: [
  { name: 'Pranzo', items: [{ name: 'Riso', qty: '80 g' }, { name: 'Pollo', qty: '150 g' }] },
  { name: 'Cena', items: [{ name: 'Pesce', qty: '200 g' }, { name: 'Verdure', qty: '250 g' }] }
] } } };

async function authed(f, identity) {
  if (identity) f.setIdentity(identity);
  const { cookie } = await f.login();
  const session = await (await f.request('/api/session', { headers: { Cookie: cookie } })).json();
  const post = (route, body) => f.request(route, { method: 'POST', body: JSON.stringify(body),
    headers: { Cookie: cookie, Origin: f.config.origin, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' } });
  const get = route => f.request(route, { headers: { Cookie: cookie } });
  return { cookie, session, post, get };
}

test('nutritionist role: grant by email at admin endpoint, login redirects to the dashboard', async t => {
  const f = await startFixture({ ALLOWED_EMAILS: 'manu@example.test' }); t.after(() => f.close());
  const admin = await authed(f);
  assert.equal(admin.session.admin, true);
  assert.equal(admin.session.role, null);
  // Validation and auth of the admin endpoint.
  assert.equal((await admin.post('/api/admin/roles', { role: 'boss' })).status, 422);
  assert.equal((await admin.post('/api/admin/roles', { role: 'nutritionist' })).status, 422);
  const bad = await f.request('/api/admin/roles', { method: 'POST', body: '{}', headers: { Cookie: admin.cookie, 'Content-Type': 'application/json', Origin: f.config.origin, 'X-CSRF-Token': 'wrong' } });
  assert.equal(bad.status, 403);
  assert.equal((await admin.post('/api/admin/roles', { email: 'doc@example.test', role: 'nutritionist' })).status, 200);
  // The grant lets the account in even though ALLOWED_EMAILS does not list it.
  const doc = await authed(f, { sub: 'google-doc', email: 'doc@example.test', name: 'Doc' });
  assert.equal(doc.session.role, 'nutritionist');
  assert.equal(doc.session.admin, false);
  const again = await f.login();
  assert.equal(again.response.headers.get('location'), '/app/nutritionist/');
  assert.equal((await f.request('/app/nutritionist/', { headers: { Cookie: again.cookie.split(';')[0] } })).status, 200);
  // A stranger with no role is still refused.
  f.setIdentity({ sub: 'google-x', email: 'stranger@example.test' });
  assert.equal((await f.login()).response.headers.get('location'), '/app/login?error=not_allowed');
  // Non-admins cannot grant roles.
  assert.equal((await doc.post('/api/admin/roles', { email: 'x@example.test', role: 'nutritionist' })).status, 403);
});

test('patients CRUD: create with invite link, duplicates and validation, role guard on the API', async t => {
  const f = await startFixture(); t.after(() => f.close());
  f.store.assignRole('google-user-1', 'nutritionist');
  const doc = await authed(f);
  assert.equal((await doc.get('/api/nutritionist/patients')).status, 200);
  const created = await doc.post('/api/nutritionist/patients', { name: 'Anna Rossi', email: 'Anna@Example.Test' });
  assert.equal(created.status, 200);
  const anna = await created.json();
  assert.match(anna.inviteUrl, new RegExp(`^${f.config.origin}/app/join\\?token=[\\w-]{40,}$`));
  assert.equal(anna.status, 'pending');
  assert.equal((await doc.post('/api/nutritionist/patients', { name: 'Anna', email: 'anna@example.test' })).status, 409);
  assert.equal((await doc.post('/api/nutritionist/patients', { name: '', email: 'x@example.test' })).status, 422);
  assert.equal((await doc.post('/api/nutritionist/patients', { name: 'X', email: 'not-an-email' })).status, 422);
  const list = await (await doc.get('/api/nutritionist/patients')).json();
  assert.equal(list.patients.length, 1);
  assert.equal(list.patients[0].compliance, null);
  // Unauthenticated and non-nutritionist callers are refused.
  assert.equal((await f.request('/api/nutritionist/patients')).status, 401);
  const other = await authed(f, { sub: 'google-2', email: 'other@example.test' });
  assert.equal((await other.get('/api/nutritionist/patients')).status, 403);
  // Another nutritionist never sees these patients.
  f.store.assignRole('google-3', 'nutritionist');
  const rival = await authed(f, { sub: 'google-3', email: 'rival@example.test' });
  assert.deepEqual((await (await rival.get('/api/nutritionist/patients')).json()).patients, []);
  assert.equal((await rival.get(`/api/nutritionist/patients/${anna.id}`)).status, 404);
});

test('invite link signs the patient in, links the account and survives ALLOWED_EMAILS', async t => {
  const f = await startFixture({ ALLOWED_EMAILS: 'manu@example.test' }); t.after(() => f.close());
  f.store.assignRole('google-doc', 'nutritionist');
  const doc = await authed(f, { sub: 'google-doc', email: 'manu@example.test', name: 'Doc' });
  const anna = await (await doc.post('/api/nutritionist/patients', { name: 'Anna', email: 'anna@example.test' })).json();
  // Visiting the join link anonymous: cookie with the token, then the Google flow.
  const joinPath = anna.inviteUrl.slice(f.config.origin.length);
  const join = await f.request(joinPath);
  assert.equal(join.status, 303);
  assert.equal(join.headers.get('location'), '/auth/google');
  const joinCookie = join.headers.getSetCookie().find(c => c.startsWith('nutra_join=')).split(';')[0];
  // The wrong Google account cannot redeem the invite.
  f.setIdentity({ sub: 'google-wrong', email: 'wrong@example.test' });
  const start1 = await f.begin();
  const wrong = await f.request(`/auth/google/callback?state=${start1.url.searchParams.get('state')}&code=test-code`, { headers: { Cookie: `${start1.cookie}; ${joinCookie}` } });
  assert.equal(wrong.headers.get('location'), '/app/login?error=not_allowed');
  // The invited email redeems it; the session works even if ALLOWED_EMAILS does not list it.
  f.setIdentity({ sub: 'google-anna', email: 'anna@example.test', name: 'Anna' });
  const start2 = await f.begin();
  const ok = await f.request(`/auth/google/callback?state=${start2.url.searchParams.get('state')}&code=test-code`, { headers: { Cookie: `${start2.cookie}; ${joinCookie}` } });
  assert.equal(ok.headers.get('location'), '/app/');
  const annaCookie = ok.headers.getSetCookie().find(c => c.startsWith('nutra_session=')).split(';')[0];
  const session = await (await f.request('/api/session', { headers: { Cookie: annaCookie } })).json();
  assert.equal(session.role, 'patient');
  const list = await (await doc.get('/api/nutritionist/patients')).json();
  assert.equal(list.patients[0].status, 'active');
  assert.equal(list.patients[0].inviteUrl, null);
  assert.ok(list.patients[0].lastSeenAt);
  // Without the link, a pending patient is matched by email on first sign-in too.
  const bruno = await (await doc.post('/api/nutritionist/patients', { name: 'Bruno', email: 'bruno@example.test' })).json();
  const brunoAuth = await authed(f, { sub: 'google-bruno', email: 'bruno@example.test', name: 'Bruno' });
  assert.equal(brunoAuth.session.role, 'patient');
  assert.equal(bruno.status, 'pending');
});

test('plan upload reaches the patient and tracking flows back as compliance', async t => {
  const f = await startFixture(); t.after(() => f.close());
  f.store.assignRole('google-doc', 'nutritionist');
  const doc = await authed(f, { sub: 'google-doc', email: 'doc@example.test', name: 'Doc' });
  const anna = await (await doc.post('/api/nutritionist/patients', { name: 'Anna', email: 'anna@example.test' })).json();
  assert.equal((await doc.post(`/api/nutritionist/patients/${anna.id}/plan`, { name: 'piano.pdf', data: { days: {} } })).status, 422);
  const upload = await doc.post(`/api/nutritionist/patients/${anna.id}/plan`, { name: 'piano.pdf', data: PLAN });
  assert.equal(upload.status, 200);
  const { planId } = await upload.json();
  // The patient signs in and receives the server plan.
  const annaAuth = await authed(f, { sub: 'google-anna', email: 'anna@example.test', name: 'Anna' });
  const received = await (await annaAuth.get('/api/plan')).json();
  assert.equal(received.plan.id, planId);
  assert.deepEqual(received.plan.data, PLAN);
  assert.deepEqual(received.tracking, {});
  // Tracking: wrong plan id refused, then checks and water are saved.
  assert.equal((await annaAuth.post('/api/tracking', { planId: 999, day: TODAY, field: 'checked', value: {} })).status, 409);
  assert.equal((await annaAuth.post('/api/tracking', { planId, day: TODAY, field: 'steps', value: 1 })).status, 422);
  assert.equal((await annaAuth.post('/api/tracking', { planId, day: TODAY, field: 'checked', value: { '0_0': true, '1_1': true } })).status, 200);
  assert.equal((await annaAuth.post('/api/tracking', { planId, day: TODAY, field: 'water', value: 5 })).status, 200);
  const noCsrf = await f.request('/api/tracking', { method: 'POST', body: '{}', headers: { Cookie: annaAuth.cookie, 'Content-Type': 'application/json' } });
  assert.equal(noCsrf.status, 403);
  // An account that is not a patient gets no plan and cannot track.
  assert.equal((await (await doc.get('/api/plan')).json()).plan, null);
  assert.equal((await doc.post('/api/tracking', { planId, day: TODAY, field: 'water', value: 1 })).status, 409);
  // The nutritionist sees today's compliance in the list and the detail.
  const list = await (await doc.get('/api/nutritionist/patients')).json();
  assert.deepEqual(list.patients[0].compliance, { done: 2, total: 4 });
  assert.equal(list.patients[0].planName, 'piano.pdf');
  const detail = await (await doc.get(`/api/nutritionist/patients/${anna.id}/compliance`)).json();
  assert.deepEqual(detail.tracking[TODAY].checked.value, { '0_0': true, '1_1': true });
  assert.equal(detail.tracking[TODAY].water.value, 5);
  assert.equal(detail.plan.id, planId);
  // A replacement upload becomes the patient's current plan.
  const second = await (await doc.post(`/api/nutritionist/patients/${anna.id}/plan`, { name: 'piano-v2.pdf', data: PLAN })).json();
  assert.equal((await (await annaAuth.get('/api/plan')).json()).plan.id, second.planId);
});

test('compliance counts only the sub-items of a composite dish, never its parent row (WF-036)', async t => {
  const f = await startFixture(); t.after(() => f.close());
  f.store.assignRole('google-doc', 'nutritionist');
  const doc = await authed(f, { sub: 'google-doc', email: 'doc@example.test', name: 'Doc' });
  const anna = await (await doc.post('/api/nutritionist/patients', { name: 'Anna', email: 'anna@example.test' })).json();
  const COMPOSITE_PLAN = { days: { [TODAY]: { dayName: 'Oggi', meals: [
    { name: 'Pranzo', items: [
      { name: 'Pasta e lenticchie', qty: '' },
      { name: 'Pasta', qty: '80 g', isSubItem: true },
      { name: 'Lenticchie', qty: '200 g', isSubItem: true }
    ] }
  ] } } };
  await doc.post(`/api/nutritionist/patients/${anna.id}/plan`, { name: 'piano.pdf', data: COMPOSITE_PLAN });
  const annaAuth = await authed(f, { sub: 'google-anna', email: 'anna@example.test', name: 'Anna' });
  const { plan } = await (await annaAuth.get('/api/plan')).json();
  // Ticking the composite's parent row alone must not count as progress: it weighs 0 of 2, not 1 of 3.
  await annaAuth.post('/api/tracking', { planId: plan.id, day: TODAY, field: 'checked', value: { '0_0': true } });
  let list = await (await doc.get('/api/nutritionist/patients')).json();
  assert.deepEqual(list.patients[0].compliance, { done: 0, total: 2 });
  // Ticking a sub-item counts it; the parent row never inflates the denominator.
  await annaAuth.post('/api/tracking', { planId: plan.id, day: TODAY, field: 'checked', value: { '0_0': true, '0_1': true } });
  list = await (await doc.get('/api/nutritionist/patients')).json();
  assert.deepEqual(list.patients[0].compliance, { done: 1, total: 2 });
});
