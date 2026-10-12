const OIL_GRAMS_PER_TEASPOON = 4;
const OIL_STEP_GRAMS = OIL_GRAMS_PER_TEASPOON / 2; // half a teaspoon
const OIL_MAX_GRAMS = 200;

const itemKey = (item, mealIndex, itemIndex) => item.id || `${mealIndex}_${itemIndex}`;
const isOil = item => /^olio\b/i.test(String(item?.name || '').trim());

function gramsOf(qty) {
  const match = String(qty || '').trim().match(/^(\d+(?:[,.]\d+)?)\s*g$/i);
  return match ? Number(match[1].replace(',', '.')) : null;
}

// One source of truth: a checked oil row counts its planned grams unless the user
// recorded an effective quantity. Sub-items of a checked recipe count too; prescribed
// alternatives never do, because the check does not say which one was eaten.
function dayOil(plan, day) {
  const checked = plan?.checked?.[day] || {}, recorded = plan?.oil?.[day] || {};
  const rows = {};
  let planned = 0, consumed = 0;
  (plan?.data?.days?.[day]?.meals || []).forEach((meal, mi) => {
    let parentKey = null;
    meal.items.forEach((item, ii) => {
      const key = itemKey(item, mi, ii);
      if (!item.isSubItem) parentKey = key;
      if (!isOil(item)) return;
      const expected = gramsOf(item.qty) ?? 0;
      const counted = !!(checked[key] || (item.isSubItem && parentKey !== null && checked[parentKey]));
      const grams = Number.isFinite(recorded[key]) ? recorded[key] : expected;
      rows[key] = { planned: expected, counted, grams };
      planned += expected;
      if (counted) consumed += grams;
    });
  });
  return { planned, consumed, rows };
}

function stepOil(grams, direction) {
  const next = Math.round(grams / OIL_STEP_GRAMS) * OIL_STEP_GRAMS + direction * OIL_STEP_GRAMS;
  return Math.max(0, Math.min(OIL_MAX_GRAMS, next));
}

function formatOil(grams, units) {
  const value = Number(grams.toFixed(1)).toLocaleString('it-IT');
  if (units === 'grams' || grams % OIL_STEP_GRAMS) return `${value} g`;
  const halves = grams / OIL_STEP_GRAMS, whole = Math.floor(halves / 2), half = halves % 2 === 1;
  if (!whole) return half ? `½ cucchiaino (${value} g)` : `0 cucchiaini (0 g)`;
  return `${whole} ${whole === 1 ? 'cucchiaino' : 'cucchiaini'}${half ? ' e ½' : ''} (${value} g)`;
}

// PDF units are the default display; grams stay visible in the note.
function displayQty(food, units) {
  if (units === 'grams' || !food.isConverted || !food.rawQty) return { qty: food.qty, note: food.conversionNote || '' };
  const rule = String(food.conversionNote || '').replace(/\s*\([^)]*\)\s*$/, '');
  return { qty: food.rawQty, note: `= ${food.qty}${rule ? ` · ${rule}` : ''}` };
}

export { itemKey, isOil, gramsOf, dayOil, stepOil, formatOil, displayQty, OIL_GRAMS_PER_TEASPOON, OIL_STEP_GRAMS };
