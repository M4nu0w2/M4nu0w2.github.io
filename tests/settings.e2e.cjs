const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');

test('settings toggle water and oil, record effective oil, switch units and clear history', async t => {
  const f = await startFixture(); const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await f.close(); });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const login = await f.login();
  await context.addCookies([{ name: 'nutripro_session', value: login.cookie.split('=')[1], url: f.config.origin }]);
  const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(f.config.origin + '/app/');
  await page.getByRole('button', { name: 'Carica il tuo PDF' }).click();
  await page.getByRole('button', { name: 'Carica Piano di Prova' }).click();
  await page.getByRole('button', { name: 'Importa e attiva' }).click();
  await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  const archive = () => page.evaluate(() => JSON.parse(localStorage.getItem('diet_plan_archive:google-user-1')));
  const nav = page.getByRole('navigation', { name: 'Navigazione principale' });
  const openToday = async () => { await nav.getByRole('link', { name: 'Oggi' }).click(); await page.getByRole('button', { name: 'Lunedì' }).click(); };
  const openSettings = async () => { await nav.getByRole('link', { name: 'Settaggi' }).click(); await page.getByRole('heading', { name: 'Settaggi', level: 1 }).waitFor(); };

  // Defaults: water on, oil off, PDF units with grams in the note.
  await openToday();
  assert.equal(await page.locator('.water-card').count(), 1);
  assert.equal(await page.locator('#oil-total').count(), 0);
  const oilRow = page.locator('.food-row', { hasText: "Olio extra vergine d'oliva" }).first();
  assert.match(await oilRow.locator('.food-qty').innerText(), /3 cucchiaini/);
  assert.match(await oilRow.innerText(), /= 12 g/);
  // A check made with oil tracking off counts the planned quantity once oil is on.
  await oilRow.locator('.food-check').check();

  await openSettings();
  assert.equal(await page.getByRole('switch', { name: /Tracking acqua/ }).isChecked(), true);
  assert.equal(await page.getByRole('switch', { name: /Tracking olio/ }).isChecked(), false);
  await page.getByRole('switch', { name: /Tracking olio/ }).check();
  await page.getByRole('switch', { name: /Tracking acqua/ }).uncheck();

  await openToday();
  assert.equal(await page.locator('.water-card').count(), 0);
  assert.match(await page.locator('#oil-total').innerText(), /12\s*\/ 20 g previsti/);
  const control = page.getByRole('group', { name: /Olio usato/ });
  assert.equal(await control.count(), 1);
  assert.equal(await control.locator('output').innerText(), '3 cucchiaini (12 g)');
  await control.getByRole('button', { name: 'Meno olio' }).click();
  assert.equal(await control.locator('output').innerText(), '2 cucchiaini e ½ (10 g)');
  assert.match(await page.locator('#oil-total').innerText(), /10\s*\/ 20 g previsti/);
  assert.deepEqual(Object.values((await archive()).plans[0].oil.lun), [10]);

  // Settings and the effective quantity survive a reload; water history is kept while hidden.
  await page.reload(); await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  await page.getByRole('button', { name: 'Lunedì' }).click();
  assert.equal(await page.getByRole('group', { name: /Olio usato/ }).locator('output').innerText(), '2 cucchiaini e ½ (10 g)');

  await openSettings();
  await page.getByRole('radio', { name: /Grammi/ }).check();
  await openToday();
  assert.equal(await oilRow.locator('.food-qty').innerText(), '12 g');
  assert.equal(await page.getByRole('group', { name: /Olio usato/ }).locator('output').innerText(), '10 g');

  await openSettings();
  await page.getByRole('button', { name: 'Cancella storico olio' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancella storico olio' });
  await dialog.getByRole('button', { name: 'Confermo: voglio cancellare lo storico' }).click();
  await dialog.getByRole('button', { name: 'Cancella definitivamente' }).click();
  await page.getByRole('status').filter({ hasText: 'Storico olio cancellato su tutti i piani.' }).waitFor();
  const saved = await archive();
  assert.deepEqual(saved.plans[0].oil, {});
  assert.deepEqual(saved.settings, { water: false, oil: true, units: 'grams' });
  assert.ok(Object.values(saved.plans[0].checked.lun).includes(true), 'meal checks are kept');

  await openToday();
  assert.equal(await page.getByRole('group', { name: /Olio usato/ }).locator('output').innerText(), '12 g');
  assert.deepEqual(errors, []);
});
