const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');

// Minimal parseable PDF with one meal on today's weekday, so today's compliance is computable.
const DAY_NAMES = ['Domenica', 'Luned\\354', 'Marted\\354', 'Mercoled\\354', 'Gioved\\354', 'Venerd\\354', 'Sabato'];
function fixturePdf() {
  const stream = `BT /F1 12 Tf 1 0 0 1 40 760 Tm (${DAY_NAMES[new Date().getDay()]}) Tj ET\nBT /F1 12 Tf 1 0 0 1 260 730 Tm (Pranzo) Tj ET\nBT /F1 12 Tf 1 0 0 1 78 700 Tm (Pane) Tj 1 0 0 1 393 700 Tm (50 g) Tj ET`;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let body = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(body)); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body);
}

test('full flow: nutritionist adds a patient, assigns a plan; the patient tracks; compliance shows up', async t => {
  const f = await startFixture(); const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await f.close(); });
  f.store.assignRole('google-doc', 'nutritionist');
  f.setIdentity({ sub: 'google-doc', email: 'doc@example.test', name: 'Doc' });
  const docLogin = await f.login();
  assert.equal(docLogin.response.headers.get('location'), '/app/nutritionist/');

  const docContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await docContext.addCookies([{ name: 'nutra_session', value: docLogin.cookie.split('=')[1], url: f.config.origin }]);
  const doc = await docContext.newPage(); const errors = []; doc.on('pageerror', e => errors.push(e.message));
  await doc.goto(f.config.origin + '/app/');
  await doc.getByRole('heading', { name: 'I tuoi pazienti' }).waitFor();
  await doc.getByText('Nessun paziente ancora.').waitFor();

  // Add a patient and read the invite link.
  await doc.getByRole('button', { name: '+ Nuovo paziente' }).click();
  await doc.getByLabel('Nome e cognome').fill('Anna Verdi');
  await doc.getByLabel("Email dell'account Google").fill('anna@example.test');
  await doc.getByRole('button', { name: 'Crea invito' }).click();
  await doc.getByRole('heading', { name: 'Anna Verdi aggiunto' }).waitFor();
  const inviteUrl = await doc.getByLabel('Link di invito').inputValue();
  assert.match(inviteUrl, /\/app\/join\?token=[\w-]{40,}$/);
  await doc.getByRole('button', { name: 'Chiudi' }).click();
  await doc.getByRole('button', { name: /Anna Verdi/ }).waitFor();
  assert.match(await doc.locator('.nutri-row').innerText(), /Invito inviato/);

  // Open the row and upload the plan PDF; the PDF is parsed in the browser.
  await doc.getByRole('button', { name: /Anna Verdi/ }).click();
  await doc.getByLabel('PDF del piano per Anna Verdi').setInputFiles({ name: 'piano-anna.pdf', mimeType: 'application/pdf', buffer: fixturePdf() });
  await doc.getByText(/Piano “piano-anna” assegnato/).waitFor();

  // The patient redeems the invite: join link, then Google login with the invited account.
  const join = await f.request(inviteUrl.slice(f.config.origin.length));
  const joinCookie = join.headers.getSetCookie().find(c => c.startsWith('nutra_join=')).split(';')[0];
  f.setIdentity({ sub: 'google-anna', email: 'anna@example.test', name: 'Anna' });
  const start = await f.begin();
  const redeemed = await f.request(`/auth/google/callback?state=${start.url.searchParams.get('state')}&code=test-code`, { headers: { Cookie: `${start.cookie}; ${joinCookie}` } });
  assert.equal(redeemed.headers.get('location'), '/app/');
  const annaCookie = redeemed.headers.getSetCookie().find(c => c.startsWith('nutra_session=')).split(';')[0];

  // The patient opens the app and receives the plan from the server, then tracks a meal and water.
  const annaContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await annaContext.addCookies([{ name: 'nutra_session', value: annaCookie.split('=')[1], url: f.config.origin }]);
  const anna = await annaContext.newPage(); anna.on('pageerror', e => errors.push(e.message));
  await anna.goto(f.config.origin + '/app/');
  await anna.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  const archive = await anna.evaluate(() => JSON.parse(localStorage.getItem('diet_plan_archive:google-anna')));
  assert.equal(typeof archive.plans[0].serverId, 'number');
  const saved = anna.waitForResponse(r => r.url().endsWith('/api/tracking') && r.ok());
  await anna.getByRole('checkbox', { name: 'Pane consumato' }).check();
  await saved;
  const watered = anna.waitForResponse(r => r.url().endsWith('/api/tracking') && r.ok());
  await anna.getByRole('button', { name: 'Aggiungi un bicchiere' }).click();
  await watered;

  // Back on the dashboard: active patient, 100% compliance today, ticked item in the detail.
  await doc.reload();
  await doc.getByRole('button', { name: /Anna Verdi/ }).waitFor();
  const row = doc.locator('.nutri-row');
  assert.match(await row.innerText(), /Attivo/);
  assert.match(await row.innerText(), /100%/);
  await doc.getByRole('button', { name: /Anna Verdi/ }).click();
  await doc.getByText(/Acqua: 1 bicchieri/).waitFor();
  assert.match(await doc.locator('.nutri-meals').innerText(), /Pane/);
  assert.equal(await doc.locator('.nutri-tick.done').count(), 1);
  assert.match(await doc.locator('.meal-heading .badge').innerText(), /1\/1/);

  // A fresh patient session still sees the server plan without reimporting it.
  await anna.evaluate(() => localStorage.clear());
  await anna.reload();
  await anna.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  assert.match(await anna.locator('.meal-list').innerText(), /Pane/);
  assert.deepEqual(errors, []);
});
