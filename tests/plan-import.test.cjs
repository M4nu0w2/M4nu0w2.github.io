'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { startFixture } = require('./auth-fixture.cjs');
const { scrub } = require('../server/anonymizer.cjs');
const { validatePlan } = require('../server/planImport.cjs');
const { fakeRizzo, fakeGemini, PLAN } = require('./plan-import-fakes.cjs');

// What leaves for Google must have passed through the anonymiser: the fakes below record
// exactly what each side received, so the tests can say what never crossed.
async function start(t, { rizzo, gemini = fakeGemini(), env = {} } = {}) {
  const f = await startFixture(rizzo ? { PII_URL: rizzo.url, ...env } : env, { geminiService: gemini });
  t.after(() => f.close());
  const { cookie } = await f.login();
  const { csrf } = await (await f.request('/api/session', { headers: { Cookie: cookie } })).json();
  const post = (body, headers = {}) => f.request('/api/plan/import', { method: 'POST',
    headers: { Cookie: cookie, Origin: f.config.origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { f, cookie, post };
}

const PAGES = [
  'MARIO ROSSI\nLunedì\nCOLAZIONE\nTè verde  1 tazza\nKiwi  n. 1  3114\nContatti: mario.rossi@example.test tel. 333 123 4567 www.studio.example 00100 Roma',
  'Piano di Mario Rossi, codice RSSMRA80A01H501U, IBAN IT60X0542811101000000123456'];

test('the text reaches Google only after the anonymiser, and without structured identifiers', async t => {
  const rizzo = await fakeRizzo(); t.after(() => rizzo.close());
  const gemini = fakeGemini();
  const { post } = await start(t, { rizzo, gemini });
  const res = await post({ pages: PAGES, consent: true });
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).plan.days[0].meals[0].items[0], { name: 'Tè verde', qty: '1 tazza' });
  // The anonymiser was asked to keep plan data (quantities, alternatives codes) and to forget the mapping.
  assert.equal(rizzo.received[0].url, '/analyze');
  assert.equal(rizzo.received[0].input.include_mapping, false);
  for (const tag of ['BUILDINGNUM', 'ZIPCODE', 'AGE', 'AMOUNT', 'DATE', 'TIME']) assert.ok(rizzo.received[0].input.exclude_tags.includes(tag), tag);
  // What Google received.
  assert.equal(gemini.calls.length, 1);
  const sent = gemini.calls[0].text;
  for (const secret of ['Mario Rossi', 'MARIO ROSSI', 'mario.rossi@example.test', '333 123 4567', 'www.studio.example', '00100', 'RSSMRA80A01H501U', 'IT60X0542811101000000123456']) assert.equal(sent.includes(secret), false, secret);
  assert.match(sent, /Tè verde {2}1 tazza/);
  assert.match(sent, /3114/); // the alternatives code survives
});

test('when the anonymiser is down, nothing is sent to Google', async t => {
  const gemini = fakeGemini();
  const { post } = await start(t, { rizzo: { url: 'http://127.0.0.1:9' }, gemini });
  const res = await post({ pages: PAGES, consent: true });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'anonymizer_unavailable');
  assert.equal(gemini.calls.length, 0);
});

test('when the anonymiser answers badly, nothing is sent to Google', async t => {
  for (const options of [{ status: 500 }, { body: { unexpected: true } }, { body: { anonymized_text: 42 } }]) {
    const rizzo = await fakeRizzo(options); t.after(() => rizzo.close());
    const gemini = fakeGemini();
    const { post } = await start(t, { rizzo, gemini });
    const res = await post({ pages: PAGES, consent: true });
    assert.ok([502, 503].includes(res.status), JSON.stringify(options));
    assert.equal(gemini.calls.length, 0, JSON.stringify(options));
  }
});

test('without an anonymiser configured the feature is off and says why', async t => {
  const gemini = fakeGemini();
  const { f, cookie, post } = await start(t, { gemini });
  const status = await (await f.request('/api/plan/status', { headers: { Cookie: cookie } })).json();
  assert.deepEqual(status, { available: false, reason: 'anonymizer_missing' });
  assert.equal((await post({ pages: PAGES, consent: true })).status, 503);
  assert.equal(gemini.calls.length, 0);
});

test('the feature is available only with the anonymiser and the provider both ready', async t => {
  const rizzo = await fakeRizzo(); t.after(() => rizzo.close());
  const { f, cookie } = await start(t, { rizzo });
  assert.deepEqual(await (await f.request('/api/plan/status', { headers: { Cookie: cookie } })).json(), { available: true, reason: null });
  const off = fakeGemini(); off.status = () => ({ enabled: false, reason: 'disabled' });
  const second = await start(t, { rizzo, gemini: off });
  assert.deepEqual(await (await second.f.request('/api/plan/status', { headers: { Cookie: second.cookie } })).json(), { available: false, reason: 'provider_disabled' });
});

test('login, Origin, CSRF, consent and the shape of the request are all required', async t => {
  const rizzo = await fakeRizzo(); t.after(() => rizzo.close());
  const gemini = fakeGemini();
  const { f, post } = await start(t, { rizzo, gemini });
  assert.equal((await f.request('/api/plan/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
  assert.equal((await post({ pages: PAGES, consent: true }, { 'X-CSRF-Token': 'wrong' })).status, 403);
  assert.equal((await post({ pages: PAGES, consent: true }, { Origin: 'https://evil.test' })).status, 403);
  assert.equal((await post({ pages: PAGES })).status, 400);
  assert.equal((await post({ pages: PAGES, consent: 'yes' })).status, 400);
  assert.equal((await post({ pages: [], consent: true })).status, 400);
  assert.equal((await post({ pages: [42], consent: true })).status, 400);
  assert.equal((await post({ pages: PAGES, consent: true, extra: 1 })).status, 400);
  assert.equal((await post({ pages: ['x'.repeat(30000)], consent: true })).status, 400);
  assert.equal(gemini.calls.length, 0);
});

test('an unusable answer from Google is refused with a plain message', async t => {
  const rizzo = await fakeRizzo(); t.after(() => rizzo.close());
  for (const answer of ['not json at all', JSON.stringify({ days: [] }), JSON.stringify({ days: [{ day: 'xyz', meals: [] }] }), new Error('boom')]) {
    const { post } = await start(t, { rizzo, gemini: fakeGemini(answer) });
    const res = await post({ pages: PAGES, consent: true });
    const body = await res.json();
    assert.ok(res.status >= 400, String(answer));
    assert.equal(/boom|SyntaxError|undefined/.test(JSON.stringify(body)), false);
  }
});

test('scrub removes identifiers by rule and leaves quantities and alternatives codes alone', () => {
  const { text } = scrub('Mail a@b.example, tel 340 476 0323 o 3404760323, www.x.example, https://y.example/p, CF RSSMRA80A01H501U, 87100 Cosenza, IBAN IT60X0542811101000000123456');
  for (const gone of ['a@b.example', '476 0323', '3404760323', 'www.x.example', 'y.example', 'RSSMRA80A01H501U', '87100', 'IT60X05428']) assert.equal(text.includes(gone), false, gone);
  const keep = 'Riso 160 g, olio 4 cucchiaini, 11 bicchieri, Kiwi n. 1 3114, 2235, 712, Acqua 15.400 ml, 1.360 g';
  assert.equal(scrub(keep).text, keep);
});

test('a valid answer is normalised and an unreasonable one is refused', () => {
  const ok = validatePlan(PLAN);
  assert.equal(ok.days[0].meals[1].type, 'pranzo');
  assert.deepEqual(ok.days[0].meals[0].items[1].alternatives, [{ name: 'Ananas', qty: '70 g' }]);
  assert.equal(validatePlan({ days: [{ day: 'lun', meals: [{ type: 'brunch', name: 'Brunch', items: [{ name: 'Pane', qty: '' }] }] }] }).days[0].meals[0].type, 'altro');
  assert.throws(() => validatePlan({ days: [{ day: 'lun', meals: [{ type: 'cena', name: 'Cena', items: Array.from({ length: 60 }, () => ({ name: 'x', qty: '' })) }] }] }));
  assert.throws(() => validatePlan({ days: [{ day: 'lun', meals: [{ type: 'cena', name: 'Cena', items: [{ name: 7, qty: '' }] }] }] }));
  assert.throws(() => validatePlan({ days: Array.from({ length: 8 }, () => ({ day: 'lun', meals: [] })) }));
});
