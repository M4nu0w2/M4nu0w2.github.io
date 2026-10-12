const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, settingsOf } = require('../src/lib/planStore.mjs');
const { dayOil, stepOil, formatOil, displayQty } = require('../src/lib/tracking.mjs');

const diet = name => ({ days: { lun: { meals: [{ items: [{ name, qty: '100 g' }] }] } } });
function storage() {
  const values = new Map();
  return { values, getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
}
const oilPlan = (checked = {}, oil = {}) => ({ checked: { lun: checked }, oil: { lun: oil }, data: { days: { lun: { meals: [
  { items: [
    { id: 'oil1', name: "Olio extra vergine d'oliva", qty: '12 g' },
    { id: 'recipe', name: 'Risotto', qty: '1 porzione' },
    { id: 'oil2', name: 'Olio extra vergine di oliva', qty: '4 g', isSubItem: true },
    { id: 'butter', name: 'Burro', qty: '10 g', alternatives: [{ name: 'Olio extra vergine di oliva', qty: '8 g' }] },
    { id: 'tuna', name: "Tonno sott'olio", qty: '50 g' }
  ] }
] } } } });

test('account settings default, persist across plans and stay separate per Google sub', () => {
  const shared = storage();
  const mine = createStore(shared, 'sub-a'), other = createStore(shared, 'sub-b');
  assert.deepEqual(settingsOf(mine.read()), { water: true, oil: false, units: 'pdf' });
  mine.importPlan(diet('Riso')); const second = mine.importPlan(diet('Pasta'));
  mine.saveSettings({ oil: true, units: 'grams' });
  const switched = mine.setActive(second.plans[0].id);
  assert.deepEqual(settingsOf(switched), { water: true, oil: true, units: 'grams' });
  assert.deepEqual(settingsOf(other.read()), { water: true, oil: false, units: 'pdf' });
  assert.throws(() => mine.saveSettings({ units: 'cups' }), /Settaggi non validi/);
  assert.throws(() => mine.saveSettings({ water: 'yes' }), /Settaggi non validi/);
  assert.equal(settingsOf(mine.read()).units, 'grams');
});

test('switching a tracking off keeps history; clearing spans every plan and spares meal checks', () => {
  const store = createStore(storage(), 'sub-a');
  let archive = store.importPlan(diet('Riso'));
  const first = archive.activeId;
  store.saveTracking(first, 'water', { lun: 4 });
  store.saveTracking(first, 'oil', { lun: { oil1: 10 } });
  store.saveTracking(first, 'checked', { lun: { oil1: true } });
  archive = store.importPlan(diet('Pasta'));
  store.saveTracking(archive.activeId, 'water', { lun: 2 });
  archive = store.saveSettings({ water: false });
  assert.deepEqual(archive.plans.map(plan => plan.water), [{ lun: 4 }, { lun: 2 }]);
  archive = store.clearTracking('water');
  assert.deepEqual(archive.plans.map(plan => plan.water), [{}, {}]);
  assert.deepEqual(archive.plans[0].oil, { lun: { oil1: 10 } });
  assert.deepEqual(archive.plans[0].checked, { lun: { oil1: true } });
  assert.throws(() => store.clearTracking('checked'), /Tracking non valido/);
});

test('archives saved before settings and oil tracking still open and accept oil', () => {
  const shared = storage();
  shared.setItem('diet_plan_archive:sub-a', JSON.stringify({ version: 1, revision: 3, activeId: 'p1',
    plans: [{ id: 'p1', name: 'Vecchio', data: diet('Riso'), checked: { lun: {} }, water: { lun: 1 } }] }));
  const store = createStore(shared, 'sub-a');
  assert.deepEqual(settingsOf(store.read()), { water: true, oil: false, units: 'pdf' });
  const archive = store.saveTracking('p1', 'oil', { lun: { oil1: 6 } });
  assert.deepEqual(archive.plans[0].oil, { lun: { oil1: 6 } });
  assert.deepEqual(archive.plans[0].water, { lun: 1 });
  shared.setItem('diet_plan_archive:sub-a', JSON.stringify({ ...JSON.parse(shared.getItem('diet_plan_archive:sub-a')), settings: 'broken' }));
  assert.throws(() => store.read(), /Archivio non valido/);
});

test('oil counts checked rows and checked recipes once, never alternatives or other foods', () => {
  assert.deepEqual(dayOil(oilPlan(), 'lun'), { planned: 16, consumed: 0, rows: {
    oil1: { planned: 12, counted: false, grams: 12 }, oil2: { planned: 4, counted: false, grams: 4 } } });
  // Checks made while oil tracking was off count the planned quantity.
  assert.equal(dayOil(oilPlan({ oil1: true }), 'lun').consumed, 12);
  assert.equal(dayOil(oilPlan({ recipe: true }), 'lun').consumed, 4);
  assert.equal(dayOil(oilPlan({ recipe: true, oil2: true }), 'lun').consumed, 4);
  assert.equal(dayOil(oilPlan({ oil1: true, butter: true, tuna: true }, { oil1: 6 }), 'lun').consumed, 6);
  assert.equal(dayOil(oilPlan({}, { oil1: 6 }), 'lun').consumed, 0);
});

test('oil steps by half a teaspoon and formats in PDF units or grams', () => {
  assert.equal(stepOil(12, -1), 10);
  assert.equal(stepOil(0, -1), 0);
  assert.equal(stepOil(5, 1), 8);
  assert.equal(stepOil(200, 1), 200);
  assert.equal(formatOil(12, 'pdf'), '3 cucchiaini (12 g)');
  assert.equal(formatOil(10, 'pdf'), '2 cucchiaini e ½ (10 g)');
  assert.equal(formatOil(4, 'pdf'), '1 cucchiaino (4 g)');
  assert.equal(formatOil(6, 'pdf'), '1 cucchiaino e ½ (6 g)');
  assert.equal(formatOil(2, 'pdf'), '½ cucchiaino (2 g)');
  assert.equal(formatOil(5, 'pdf'), '5 g');
  assert.equal(formatOil(12, 'grams'), '12 g');
});

test('PDF units show the original measure with grams in the note', () => {
  const oil = { name: 'Olio', qty: '12 g', rawQty: '3 cucchiaini', isConverted: true, conversionNote: '1 cucchiaino olio = 4 g (3 cucchiaini)' };
  assert.deepEqual(displayQty(oil, 'pdf'), { qty: '3 cucchiaini', note: '= 12 g · 1 cucchiaino olio = 4 g' });
  assert.deepEqual(displayQty(oil, 'grams'), { qty: '12 g', note: '1 cucchiaino olio = 4 g (3 cucchiaini)' });
  assert.deepEqual(displayQty({ name: 'Mela', qty: '150 g', rawQty: '150 g', isConverted: false }, 'pdf'), { qty: '150 g', note: '' });
});
