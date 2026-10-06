const { test } = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../src/lib/dietEngine.mjs');
function app(pdfLines = [], extraPages = []) {
  const pages = [pdfLines, ...extraPages];
  const pdf = { getDocument: () => ({ promise: Promise.resolve({
    numPages: pages.length, getPage: async pageNum => ({ getTextContent: async () => ({ items: pages[pageNum - 1].flatMap((line, i) =>
      line.map(([x, str]) => ({ str, transform: [1, 0, 0, 1, x, 800 - i * 20] }))) }) })
  }) }) };
  return { ...engine, parseProgeoPdf: buffer => engine.parseProgeoPdf(buffer, undefined, pdf) };
}
const food = (name, qty, extras = {}) => ({ name, qty, rawName: name, rawQty: qty, ...extras });
const diet = (...items) => ({ days: { lun: { dayName: 'Lunedì', meals: [{ items }] } } });
const plain = value => JSON.parse(JSON.stringify(value));

test('totals identical foods, converts kg to g, filters days without changing plan', () => {
  const data = diet(food('Riso', '100 g'), food('riso', '0,2 kg'));
  data.days.mar = { meals: [{ items: [food('Pane', '50 g')] }] };
  const snapshot = JSON.stringify(data);
  assert.deepEqual(plain(app().buildShoppingList(data, ['lun'])), ['Riso — 300 g']);
  assert.equal(JSON.stringify(data), snapshot);
});
test('keeps alternative quantities on one line, sums repeated choice groups', () => {
  const choice = food('Vitello', '150 g', { alternatives: [food('Pollo', '180 g')] });
  assert.deepEqual(plain(app().buildShoppingList(diet(choice, choice), ['lun'])),
    ['Vitello — 300 g oppure Pollo — 360 g']);
});
test('does not add alternatives to required foods or guess missing quantities', () => {
  const data = diet(food('Pollo', '50 g'), food('Vitello', '150 g', { alternatives: [food('Pollo', '')] }));
  assert.deepEqual(plain(app().buildShoppingList(data, ['lun'])),
    ['Pollo — 50 g', 'Vitello — 150 g oppure Pollo — quantità non indicata']);
});
test('omits recipe headings, retains ingredients and quantities that cannot be summed', () => {
  const data = diet(food('Insalata composta', '1 porzione'), food('Pomodori', '100 g', { isSubItem: true }),
    food('Sale', 'q.b.'), food('Sale', 'q.b.'), food('Pane', '1 fetta'), food('Pane', '20 g'));
  assert.deepEqual(plain(app().buildShoppingList(data, ['lun'])),
    ['Pomodori — 100 g', 'Sale — q.b.', 'Pane — 1 fetta', 'Pane — 20 g']);
});
test('empty selection and missing diet produce empty lists', () => {
  assert.deepEqual(plain(app().buildShoppingList(null, ['lun'])), []);
  assert.deepEqual(plain(app().buildShoppingList(diet(food('Riso', '100 g')), [])), []);
});
test('retains legacy alternatives and converted purchase weights', () => {
  const data = diet(food('Ceci cotti in scatola', '125 g', { rawName: 'Ceci secchi', rawQty: '2,5 cucchiai',
    alt: 'Alt: Lenticchie secche 50 g' }));
  assert.deepEqual(plain(app().buildShoppingList(data, ['lun'])),
    ['Ceci cotti in scatola — 125 g oppure Lenticchie cotte in scatola — 125 g']);
});
test('recognizes inline explicit alternatives with separate or shared quantities', () => {
  const context = app();
  const separate = context.parseFoodChoices('Vitello 150 g oppure Pollo 180 g', '');
  assert.equal(separate.name, 'Vitello');
  assert.equal(separate.qty, '150 g');
  assert.equal(separate.alternatives[0].qty, '180 g');
  const shared = context.parseFoodChoices('Vitello o Pollo', '150 g');
  assert.equal(shared.alternatives[0].qty, '150 g');
});
test('PDF parser attaches explicit alternative rows to preceding food', async () => {
  const context = app([[[40, 'Lunedì']], [[40, 'Pranzo']], [[40, 'Vitello'], [250, 'g 150']],
    [[40, 'oppure Pollo'], [250, 'g 180']], [[40, 'Pane'], [250, 'g 50']]]);
  const result = await context.parseProgeoPdf(new ArrayBuffer(0));
  assert.deepEqual(plain(context.buildShoppingList(result, ['lun'])),
    ['Vitello — 150 g oppure Pollo — 180 g', 'Pane — 50 g']);
});
test('PDF parser retains inline alternatives before cleaning quantity suffixes', async () => {
  const context = app([[[40, 'Lunedì']], [[40, 'Cena']], [[40, 'Vitello 150 g oppure Pollo 180 g']]]);
  const result = await context.parseProgeoPdf(new ArrayBuffer(0));
  assert.deepEqual(plain(context.buildShoppingList(result, ['lun'])), ['Vitello — 150 g oppure Pollo — 180 g']);
});
test('sample retains its existing alternative', () => {
  assert.ok(app().buildShoppingList(app().getSampleProgeoDiet(), ['lun']).some(line => line.includes('oppure')));
});

test('standalone connectors attach multiple choices, but never cross meals', async () => {
  const context = app([[[40, 'Lunedì']], [[40, 'Pranzo']], [[40, 'Vitello'], [250, '150 g']],
    [[40, 'oppure']], [[40, 'Pollo'], [250, '180 g']], [[40, 'oppure Tacchino'], [250, '160 g']],
    [[40, 'oppure']], [[40, 'Cena']], [[40, 'Pane'], [250, '50 g']]]);
  const result = await context.parseProgeoPdf(new ArrayBuffer(0));
  assert.deepEqual(plain(context.buildShoppingList(result, ['lun'])),
    ['Vitello — 150 g oppure Pollo — 180 g oppure Tacchino — 160 g', 'Pane — 50 g']);
});
test('keeps unconvertible repeated servings visible and sums ml/l accurately', () => {
  const data = diet(food('Uova', '2 pezzi'), food('Uova', '2 pezzi'), food('Acqua', '0,5 l'), food('Acqua', '250 ml'));
  assert.deepEqual(plain(app().buildShoppingList(data, ['lun', 'lun'])), ['Uova — 4 pezzi', 'Acqua — 750 ml']);
});
test('choice quantities can occupy separate table cells', () => {
  const parsed = app().parseFoodChoices('Vitello oppure Pollo', '150 g oppure 180 g');
  assert.equal(parsed.qty, '150 g');
  assert.equal(parsed.alternatives[0].qty, '180 g');
});

test('coded appendix links alternatives, including pages without the appendix title', async () => {
  const context = app([[[40, 'Mercoledì']], [[260, 'Cena']], [[78, 'Vitello magro'], [411, 'g'], [429, '300'], [477, '2136']]], [
    [[[200, 'Alternative alimentari']], [[142, '2136: Vitello magro']], [[146, 'Alimento'], [396, 'Quantità 1']],
      [[146, 'Vitello magro'], [400, 'g'], [431, '300']], [[146, 'Coscia di pollo'], [400, 'g'], [428, '240']]],
    [[[142, '2217: Orata']], [[146, 'Alimento'], [396, 'Quantità 1']], [[146, 'Orata'], [400, 'g'], [431, '300']],
      [[146, 'Salmone fresco'], [400, 'g'], [428, '230']]]
  ]);
  const data = await context.parseProgeoPdf(new ArrayBuffer(0));
  assert.deepEqual(plain(context.buildShoppingList(data, ['mer'])), ['Vitello magro — 300 g oppure Coscia di pollo — 240 g']);
  assert.equal(data.days.mer.meals[0].items[0].alternativeCode, '2136');
  assert.equal(data.days.gio.meals.length, 0);
});
test('recipe alternatives keep all ingredients together and do not duplicate base ingredients', async () => {
  const context = app([[[40, 'Lunedì']], [[260, 'Pranzo']], [[78, 'Riso con verdure'], [483, '502']],
    [[81, '- Riso integrale'], [402, '8 cucchiai']], [[81, '- Zucca'], [368, 'quantità bastante']],
    [[78, 'Pane'], [411, 'g'], [429, '50']]], [
    [[[142, '502: Riso con verdure']], [[146, 'Alimento'], [396, 'Quantità 1']], [[146, 'Riso con verdure']],
      [[146, '- Riso integrale'], [400, '8 cucchiai']], [[146, '- Zucca'], [365, 'quantità bastante']],
      [[146, 'Riso e seppie']], [[146, '- Riso integrale'], [381, '7 cucchiai e ½']],
      [[146, '- Seppie'], [400, 'g'], [437, '50']]]
  ]);
  const data = await context.parseProgeoPdf(new ArrayBuffer(0));
  const lines = plain(context.buildShoppingList(data, ['lun']));
  assert.equal(lines.length, 2);
  assert.ok(lines[0].includes('Riso integrale — 160 g + Zucca — q.b.'));
  assert.ok(lines[0].includes('oppure Riso e seppie (Riso integrale — 150 g + Seppie — 50 g)'));
  assert.equal(lines[1], 'Pane — 50 g');
});
test('meal headers never match extra virgin oil; additional meals are headers', async () => {
  const context = app([[[40, 'Lunedì']], [[260, 'Pranzo']], [[78, 'Olio extra vergine di oliva'], [393, '4 cucchiaini']],
    [[241, 'Pasto aggiuntivo 1']], [[78, 'Melone'], [411, 'g'], [429, '200']]]);
  const data = await context.parseProgeoPdf(new ArrayBuffer(0));
  assert.deepEqual(plain(context.buildShoppingList(data, ['lun'])), ['Olio extra vergine di oliva — 16 g', 'Melone — 200 g']);
  assert.equal(data.days.lun.meals.length, 2);
});
test('unicode half glasses/spoons are respected; dry gram weights are not counted as spoons', () => {
  const context = app();
  assert.equal(context.convertQuantityEngine("Fiocchi d'avena", '½ bicchiere').qty, '20 g');
  assert.equal(context.convertQuantityEngine('Riso', '7 cucchiai e ½').qty, '150 g');
  assert.equal(context.convertQuantityEngine('Ceci secchi', '50 g').qty, '125 g');
});
test('PDF unit measures override generic coefficients and preserve counts', async () => {
  const context = app([[[40, 'Martedì']], [[260, 'Pranzo']], [[78, 'Lenticchie secche'], [402, '8 cucchiai'], [477, '1192']],
    [[78, 'Semi di chia'], [393, '2 cucchiaini']], [[78, 'Uovo di gallina'], [430, 'n° 2']],
    [[78, 'Uovo di gallina'], [430, 'n° 2']]], [
    [[[142, '1192: Lenticchie secche']], [[146, 'Alimento'], [396, 'Quantità 1']],
      [[146, 'Lenticchie secche'], [400, '8 cucchiai']], [[146, 'Fagioli di soia secchi'], [400, '7 cucchiai']]],
    [[[260, 'Unità di misura']], [[46, 'Alimento'], [183, 'Unità di misura']],
      [[46, 'Fagioli di soia secchi'], [183, 'Un cucchiaio da minestra contiene circa g 16.']],
      [[46, 'Semi di chia'], [183, 'Un cucchiaino di misura media contiene circa g 3.']]]
  ]);
  const data = await context.parseProgeoPdf(new ArrayBuffer(0));
  assert.deepEqual(plain(context.buildShoppingList(data, ['mar'])),
    ['Lenticchie cotte in scatola — 400 g oppure Fagioli di soia cotti in scatola — 280 g', 'Semi di chia — 6 g', 'Uovo di gallina — 4 pezzi']);
});

test('appendix preserves inline aliases and scales every nested alternative', async () => {
  const context = app([[[40, 'Lunedì']], [[260, 'Cena']], [[78, 'Merluzzo o Nasello'], [411, 'g'], [429, '600'], [477, '2216']]], [
    [[[142, '2216: Merluzzo o Nasello']], [[146, 'Alimento'], [396, 'Quantità 1']],
      [[146, 'Merluzzo o Nasello'], [400, 'g'], [431, '300']],
      [[146, 'Acciughe o Alici'], [400, 'g'], [431, '240']]]
  ]);
  const data = await context.parseProgeoPdf(new ArrayBuffer(0));
  assert.deepEqual(plain(context.buildShoppingList(data, ['lun'])),
    ['Merluzzo — 600 g oppure Nasello — 600 g oppure Acciughe — 480 g oppure Alici — 480 g']);
});
test('recipe choice groups aggregate all quantities without making their ingredients mandatory', () => {
  const choice = food('Uovo', 'n° 2', { alternatives: [food('Frittata', '', {
    recipeIngredients: [food('Uovo', 'n° 1'), food('Parmigiano', '20 g')] })] });
  assert.deepEqual(plain(app().buildShoppingList(diet(choice, choice, food('Parmigiano', '10 g')), ['lun'])),
    ['Uovo — 4 pezzi oppure Frittata (Uovo — 2 pezzi + Parmigiano — 40 g)', 'Parmigiano — 10 g']);
});
