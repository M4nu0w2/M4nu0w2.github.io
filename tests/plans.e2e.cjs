const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');
const path = require('node:path');
const os = require('node:os');

// Synthetic public PDF exercises the bundled parser and worker without private data or hooks.
function dietPdf() {
  const stream = 'BT /F1 12 Tf 40 760 Td (Lunedi) Tj 0 -30 Td (Pranzo) Tj 0 -30 Td (Pane 50 g) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
async function setup(t) {
  const f = await startFixture(); const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } }); const login = await f.login();
  await context.addCookies([{ name: 'nutripro_session', value: login.cookie.split('=')[1], url: f.config.origin }]);
  const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  t.after(async () => { await browser.close(); await f.close(); });
  await page.goto(f.config.origin);
  await page.getByRole('button', { name: 'Carica il tuo PDF' }).click();
  await page.getByRole('button', { name: 'Carica Piano di Prova Progeo' }).click();
  await page.getByRole('button', { name: 'Importa e attiva' }).click();
  await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  const archive = () => page.evaluate(() => JSON.parse(localStorage.getItem('diet_plan_archive:google-user-1')));
  const upload = name => page.getByLabel('PDF del piano').setInputFiles({ name, mimeType: 'application/pdf', buffer: dietPdf() });
  const manage = () => page.getByRole('link', { name: 'Gestisci piani', exact: true }).click();
  return { f, page, context, archive, upload, manage, errors };
}

test('React archive retains tracking; readonly history, activation, deactivation and reload', async t => {
  const { page, archive, upload, manage, errors } = await setup(t);
  await page.locator('#btn-water-plus').click(); await page.locator('.food-check').first().check();
  const original = (await archive()).plans[0];
  await manage(); await page.getByRole('button', { name: '+ Nuovo piano', exact: true }).click();
  await upload('Ottobre.pdf'); await page.getByRole('button', { name: 'Importa e attiva' }).click();
  await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  const a = await archive(); assert.equal(a.plans.length, 2); assert.deepEqual(a.plans[0], original); assert.deepEqual(a.plans[1].water, {});
  await manage();
  await page.locator('.plan-card').filter({ has: page.getByRole('heading', { name: original.name, exact: true }) }).getByRole('link', { name: 'Consulta piano' }).click();
  await page.getByRole('heading', { name: original.name, exact: true }).waitFor();
  assert.equal(await page.getByRole('checkbox').count(), 0); assert.deepEqual(await archive(), a);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(os.tmpdir(), 'nutripro-plans-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Rendi attivo', exact: true }).click(); await page.locator('#water-badge').waitFor();
  assert.equal((await archive()).activeId, original.id); assert.match(await page.locator('#water-badge').innerText(), /1 \/ 12 \(0,2 L\)/);
  await page.reload(); await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  assert.equal(await page.locator('.food-check').first().isChecked(), true);
  await manage(); await page.locator('.active-plan').getByRole('button', { name: 'Disattiva', exact: true }).click();
  assert.equal((await archive()).activeId, null);
  await page.locator('.plan-card').filter({ has: page.getByRole('heading', { name: 'Ottobre', exact: true }) }).getByRole('button', { name: 'Rendi attivo', exact: true }).click();
  await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor(); assert.equal((await archive()).plans.length, 2); assert.deepEqual(errors, []);
});

test('React replacement requires both confirmations; invalid PDF and cancellation preserve archive', async t => {
  const { page, archive, upload, manage, errors } = await setup(t);
  await manage(); const original = await archive();
  await page.getByRole('button', { name: 'Sostituisci PDF' }).click(); assert.equal(await page.getByLabel('PDF del piano').count(), 0);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); assert.deepEqual(await archive(), original);
  await page.getByRole('button', { name: 'Sostituisci PDF' }).click(); await page.getByRole('button', { name: 'Confermo: voglio sostituire il piano attuale' }).click();
  await page.getByLabel('PDF del piano').setInputFiles({ name: 'Invalido.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Not a PDF') });
  await page.getByRole('alert').waitFor(); assert.deepEqual(await archive(), original);
  await upload('Correzione.pdf'); const confirm = page.getByRole('checkbox', { name: /Confermo definitivamente/ }); await confirm.waitFor();
  assert.equal(await page.getByRole('button', { name: 'Sostituisci definitivamente' }).isDisabled(), true); assert.deepEqual(await archive(), original);
  await page.getByRole('button', { name: 'Annulla', exact: true }).click(); assert.deepEqual(await archive(), original);
  await page.getByRole('button', { name: 'Sostituisci PDF' }).click(); await page.getByRole('button', { name: 'Confermo: voglio sostituire il piano attuale' }).click();
  await upload('Correzione.pdf'); await confirm.check();
  await page.screenshot({ path: path.join(os.tmpdir(), 'nutripro-replace-confirmation.png'), fullPage: true });
  await page.getByRole('button', { name: 'Sostituisci definitivamente' }).click(); await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  const result = await archive(); assert.equal(result.plans.length, 1); assert.equal(result.activeId, original.activeId); assert.equal(result.plans[0].name, 'Correzione'); assert.deepEqual(errors, []);
});

test('React stale replacement cannot overwrite a newer plan from another tab', async t => {
  const { page, archive, upload, manage, context, f } = await setup(t);
  await manage(); await page.getByRole('button', { name: 'Sostituisci PDF' }).click(); await page.getByRole('button', { name: 'Confermo: voglio sostituire il piano attuale' }).click();
  await upload('Correzione.pdf'); await page.getByRole('checkbox', { name: /Confermo definitivamente/ }).waitFor();
  const other = await context.newPage(); await other.goto(`${f.config.origin}/plans`);
  await other.getByRole('button', { name: '+ Nuovo piano' }).click(); await other.getByRole('button', { name: 'Carica Piano di Prova Progeo' }).click(); await other.getByRole('button', { name: 'Importa e attiva' }).click();
  await other.getByRole('heading', { name: 'Il menu di oggi' }).waitFor(); await page.bringToFront(); const snapshot = await archive();
  await page.getByRole('checkbox', { name: /Confermo definitivamente/ }).check(); await page.getByRole('button', { name: 'Sostituisci definitivamente' }).click(); await page.getByRole('alert').first().waitFor(); assert.deepEqual(await archive(), snapshot);
});
