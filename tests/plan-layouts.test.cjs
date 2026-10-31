'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../src/lib/dietEngine.mjs');

// Fixtures hold the text geometry (string, x, y, width) of two real plans, anonymised: no name,
// address, phone, e-mail or vendor. They are the contract for "any template".
const load = name => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')).pages;
const fakePdf = pages => ({ getDocument: () => ({ promise: Promise.resolve({
  numPages: pages.length,
  getPage: async n => ({ getTextContent: async () => ({ items: pages[n - 1].map(([str, x, y, width]) => ({ str, width, transform: [1, 0, 0, 1, x, y] })) }) })
}) }) });
const parse = pages => engine.parseDietPdf(new ArrayBuffer(0), undefined, fakePdf(pages));
const summary = day => day.meals.map(meal => `${meal.name}(${meal.items.length})`);
const names = meal => meal.items.map(item => item.rawName);
const monday = data => Object.fromEntries(data.days.lun.meals.map(meal => [meal.name, meal]));

test('template with one day per page: footers are never read as foods', async () => {
  const data = await parse(load('plan-daily-pages.json'));
  assert.deepEqual(summary(data.days.lun), ['Colazione(5)', 'Metà mattina(1)', 'Pranzo(7)', 'Merenda(2)', 'Cena(5)', 'Arco della giornata(1)', 'Pasto aggiuntivo 1(2)']);
  const everyItem = Object.values(data.days).flatMap(day => day.meals.flatMap(meal => meal.items.map(item => item.rawName)));
  assert.equal(everyItem.some(name => /powered by|®/i.test(name)), false);
  assert.equal(Object.values(data.days).every(day => day.meals.length >= 6), true);
});

test('template with two day columns per page: seven days, each with its own meals', async () => {
  const data = await parse(load('plan-two-columns.json'));
  assert.deepEqual(summary(data.days.lun), ['Colazione(5)', 'Metà mattina(1)', 'Pranzo(7)', 'Merenda(2)', 'Cena(5)', 'Arco della giornata(1)', 'Pasto aggiuntivo 1(2)']);
  assert.deepEqual(summary(data.days.mar), ['Colazione(5)', 'Metà mattina(1)', 'Pranzo(5)', 'Merenda(2)', 'Cena(5)', 'Arco della giornata(1)']);
  // A recipe title that wraps onto two lines is one entry, not two.
  assert.deepEqual(names(data.days.mer.meals.find(meal => meal.name === 'Pranzo')).slice(0, 3), ['Pasta integrale con i broccoli', 'Pasta integrale', 'Broccolo a testa']);
  assert.deepEqual(summary(data.days.mer), ['Colazione(5)', 'Metà mattina(1)', 'Pranzo(6)', 'Merenda(2)', 'Cena(5)', 'Arco della giornata(1)', 'Pasto aggiuntivo 1(2)']);
  assert.deepEqual(summary(data.days.sab), ['Colazione(5)', 'Metà mattina(1)', 'Pranzo(4)', 'Merenda(2)', 'Cena(2)', 'Arco della giornata(1)']);
  assert.deepEqual(summary(data.days.dom), ['Colazione(5)', 'Metà mattina(1)', 'Pranzo(6)', 'Merenda(2)', 'Cena(4)', 'Arco della giornata(1)']);
  assert.equal(Object.values(data.days).every(day => day.meals.length >= 6), true);
});

test('two columns: wrapped names, split quantities and the same-for-every-day strip', async () => {
  const meals = monday(await parse(load('plan-two-columns.json')));
  assert.deepEqual(names(meals.Colazione), ['Tè verde', 'Frisella', 'Burro di arachidi a ridotto contenuto di grassi', 'Kiwi', 'Semi di sesamo']);
  const merenda = meals.Merenda.items[0];
  assert.equal(merenda.rawName, 'Yogurt greco da latte scremato (170 g)');
  assert.equal(merenda.rawQty, '1 vasetto');
  assert.equal(meals.Colazione.items[2].rawQty, '20 g');
  // "Ogni giorno · Metà mattina: nocciole 10 g · Acqua …: 11 bicchieri" applies to every day.
  assert.deepEqual(names(meals['Metà mattina']), ['Nocciole']);
  assert.equal(meals['Metà mattina'].items[0].rawQty, '10 g');
  assert.match(meals['Arco della giornata'].items[0].rawName, /^Acqua/);
  assert.match(meals['Arco della giornata'].items[0].rawQty, /^11 bicchieri/);
  // Recipe with sub-ingredients, "quantità bastante" split over two lines, alternative code column.
  const [recipe, rice, pumpkin] = meals.Pranzo.items;
  assert.equal(recipe.rawName, 'Riso integrale con la zucca');
  assert.equal(recipe.isRecipe, true);
  assert.equal(recipe.alternativeCode, '502');
  assert.deepEqual([rice.rawName, rice.rawQty, rice.isSubItem], ['Riso integrale', '8 cucchiai', true]);
  assert.deepEqual([pumpkin.rawName, pumpkin.rawQty], ['Zucca', 'q.b.']);
  assert.equal(meals.Colazione.items[3].alternativeCode, '3114');
});

test('a plan with only the first page still imports, and says how much was understood', async () => {
  const data = await parse(load('plan-two-columns.json').slice(0, 1));
  assert.equal(data.metadata.quality.recognizedDays, 2);
  assert.equal(data.metadata.quality.warnings.some(text => /2 giorni su 7/.test(text)), true);
});

test('a PDF with no text layer is reported as such, in plain Italian', async () => {
  await assert.rejects(parse([[], []]), error => error.code === 'PDF_NO_TEXT' && /scansion|immagin/i.test(error.message) && !/EMPTY_PARSED_DATA/.test(error.message));
});

test('text that is not a meal plan is reported, never imported as one', async () => {
  const letter = [['Gentile cliente,', 40, 780, 80], ['le scriviamo per confermare il suo appuntamento di martedì.', 40, 760, 300], ['Cordiali saluti', 40, 740, 80]];
  await assert.rejects(parse([letter]), error => error.code === 'PLAN_NOT_RECOGNIZED' && /piano alimentare/i.test(error.message));
});

test('two columns: the alternatives pages are linked to the foods by their code', async () => {
  const data = await parse(load('plan-two-columns.json'));
  assert.equal(data.metadata.alternativesImported, true);
  const meals = monday(data);
  const choices = item => item.alternatives.map(choice => `${choice.rawName} ${choice.rawQty}`.trim());
  // Foods with a quantity each.
  assert.deepEqual(choices(meals.Colazione.items[3]), ['Ananas 70 g', 'Banane n. ½', 'Uva 70 g', 'Prugne n. 2']);
  // Vegetables share one quantity, printed once as "per ciascuna alternativa".
  assert.deepEqual(choices(meals.Pranzo.items[4]), ['Cicoria 1 porzione', 'Insalata mista 1 porzione', 'Lattuga 1 porzione', 'Scarola 1 porzione', 'Valeriana 1 porzione']);
  // Recipes: the choice keeps all its ingredients, whatever the line wraps.
  const recipe = meals.Pranzo.items[0].alternatives.find(choice => choice.rawName === 'Riso integrale, pomodoro e piselli');
  assert.deepEqual(recipe.recipeIngredients.map(food => `${food.rawName} ${food.rawQty}`), ['Riso integrale 7 cucchiai e ½', 'Salsa di pomodoro q.b.', 'Piselli freschi 2 cucchiai e ½']);
  // Fish: name with "o" is a single food with its own group.
  assert.equal(choices(meals.Cena.items[0]).includes('Calamari 320 g'), true);
});

test('two columns: a code of two digits links its alternatives too', async () => {
  const data = await parse(load('plan-two-columns.json'));
  const lunch = data.days.mer.meals.find(meal => meal.name === 'Pranzo').items[0];
  assert.equal(lunch.alternativeCode, '96');
  assert.deepEqual(lunch.alternatives.map(choice => choice.rawName), ['Pasta integrale, verdure e parmigiano', 'Pasta integrale, pomodoro, piselli e parmigiano', 'Pasta integrale, pomodoro e ricotta di vacca']);
});
