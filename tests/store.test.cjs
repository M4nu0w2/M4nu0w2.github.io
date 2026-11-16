'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createAppStore, validPlanData, dayKeyFor } = require('../server/store.cjs');

const PLAN = { days: { lun: { dayName: 'Lunedì', meals: [{ name: 'Pranzo', items: [{ name: 'Riso', qty: '80 g' }, { name: 'Pollo', qty: '150 g' }] }] } } };

test('migrations run once, are recorded, and survive reopening the same file', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nutra-store-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'nested', 'app.sqlite');
  const first = createAppStore(file);
  const db = first.open();
  const versions = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(r => r.version);
  assert.deepEqual(versions, [1]);
  for (const table of ['roles', 'role_grants', 'patients', 'plans', 'plan_tracking']) {
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table), table);
  }
  first.assignRole('sub-1', 'nutritionist');
  first.close();
  const reopened = createAppStore(file);
  assert.equal(reopened.roleOf('sub-1'), 'nutritionist');
  assert.equal(reopened.open().prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n, 1);
  reopened.close();
});

test('roles: assign, read, invalid role rejected, grants are one-shot per email', () => {
  const store = createAppStore(':memory:');
  assert.equal(store.roleOf('nobody'), null);
  assert.equal(store.roleOf(''), null);
  store.assignRole('sub-n', 'nutritionist');
  assert.equal(store.roleOf('sub-n'), 'nutritionist');
  store.assignRole('sub-n', 'patient');
  assert.equal(store.roleOf('sub-n'), 'patient');
  assert.throws(() => store.assignRole('sub-x', 'admin'), /Ruolo non valido/);
  store.grantRole('Doc@Example.Test', 'nutritionist');
  assert.equal(store.takeGrant('doc@example.test'), 'nutritionist');
  assert.equal(store.takeGrant('doc@example.test'), null);
  store.close();
});

test('patients: create with unique invite token, list, lookup, link assigns patient role', () => {
  const store = createAppStore(':memory:');
  const anna = store.addPatient('nut-1', { name: 'Anna', email: 'Anna@Example.Test' });
  assert.equal(anna.email, 'anna@example.test');
  assert.match(anna.inviteToken, /^[\w-]{40,}$/);
  assert.equal(anna.googleSub, null);
  const bruno = store.addPatient('nut-1', { name: 'Bruno', email: 'bruno@example.test' });
  assert.notEqual(anna.inviteToken, bruno.inviteToken);
  // Same email for the same nutritionist is refused; another nutritionist may add it.
  assert.throws(() => store.addPatient('nut-1', { name: 'Anna2', email: 'anna@example.test' }));
  store.addPatient('nut-2', { name: 'Anna', email: 'anna@example.test' });
  assert.equal(store.listPatients('nut-1').length, 2);
  assert.equal(store.patientOf('nut-1', anna.id).name, 'Anna');
  assert.equal(store.patientOf('nut-2', anna.id), null);
  assert.equal(store.patientByToken(anna.inviteToken).id, anna.id);
  assert.equal(store.patientByToken('short'), null);
  assert.equal(store.patientByToken('x'.repeat(50) + '!'), null);
  store.linkPatient(anna.id, 'google-anna');
  assert.equal(store.patientBySub('google-anna').id, anna.id);
  assert.equal(store.roleOf('google-anna'), 'patient');
  assert.ok(store.patientOf('nut-1', anna.id).lastSeenAt);
  // Linking is first-come only: a second sub cannot take over the row.
  store.linkPatient(anna.id, 'google-intruso');
  assert.equal(store.patientOf('nut-1', anna.id).googleSub, 'google-anna');
  store.close();
});

test('plans: shape validated, latest upload wins, history preserved', () => {
  const store = createAppStore(':memory:');
  const patient = store.addPatient('nut-1', { name: 'Anna', email: 'anna@example.test' });
  assert.throws(() => store.assignPlan(patient.id, { name: 'vuoto', data: { days: {} } }), /invalid_plan/);
  assert.ok(!validPlanData({ days: { lun: { meals: [] } } }));
  assert.ok(validPlanData(PLAN));
  const firstId = store.assignPlan(patient.id, { name: 'piano-v1.pdf', data: PLAN });
  const secondId = store.assignPlan(patient.id, { name: 'piano-v2.pdf', data: PLAN });
  assert.ok(secondId > firstId);
  const current = store.planForPatient(patient.id);
  assert.equal(current.id, secondId);
  assert.equal(current.name, 'piano-v2.pdf');
  assert.deepEqual(current.data, PLAN);
  assert.equal(store.planForPatient(99999), null);
  store.close();
});

test('tracking: upsert per (sub, plan, day, field), read grouped, invalid input rejected', () => {
  let clock = Date.UTC(2026, 10, 9, 12); // a Monday
  const store = createAppStore(':memory:', () => clock);
  const patient = store.addPatient('nut-1', { name: 'Anna', email: 'anna@example.test' });
  store.linkPatient(patient.id, 'google-anna');
  const planId = store.assignPlan(patient.id, { name: 'piano.pdf', data: PLAN });
  store.saveTracking('google-anna', planId, 'lun', 'checked', { '0_0': true });
  store.saveTracking('google-anna', planId, 'lun', 'water', 3);
  clock += 3600000;
  store.saveTracking('google-anna', planId, 'lun', 'checked', { '0_0': true, '0_1': true });
  const all = store.trackingFor('google-anna', planId);
  assert.deepEqual(all.lun.checked.value, { '0_0': true, '0_1': true });
  assert.equal(all.lun.water.value, 3);
  assert.ok(all.lun.checked.updatedAt > all.lun.water.updatedAt);
  const dayOnly = store.trackingFor('google-anna', planId, 'lun');
  assert.deepEqual(Object.keys(dayOnly), ['lun']);
  assert.deepEqual(store.trackingFor('google-anna', planId, 'mar'), {});
  assert.throws(() => store.saveTracking('google-anna', planId, 'lun', 'steps', 1), /invalid_field/);
  assert.throws(() => store.saveTracking('google-anna', planId, 'giorno non valido!', 'water', 1), /invalid_day/);
  assert.throws(() => store.saveTracking('google-anna', planId, 'lun', 'checked', { blob: 'x'.repeat(70000) }), /payload_too_large/);
  assert.equal(dayKeyFor(clock), 'lun');
  store.close();
});

test('dayKeyFor reads the Italian day, not the container clock\'s (WF-037)', () => {
  // 23:30 UTC on a Sunday is 00:30 CET Monday in Italy: the deploy container runs in UTC
  // (no TZ in the Dockerfile), so this is exactly the midnight window the ticket flags.
  const sundayLateUtc = Date.UTC(2026, 10, 8, 23, 30); // 2026-11-08T23:30Z == 2026-11-09 00:30 Europe/Rome
  const script = `console.log(require(${JSON.stringify(path.join(__dirname, '..', 'server', 'store.cjs'))}).dayKeyFor(${sundayLateUtc}))`;
  for (const TZ of ['UTC', 'Europe/Rome', 'America/New_York']) {
    const result = execFileSync(process.execPath, ['-e', script], { env: { ...process.env, TZ }, encoding: 'utf8' }).trim();
    assert.equal(result, 'lun', `TZ=${TZ} should still see Monday in Italy`);
  }
});
