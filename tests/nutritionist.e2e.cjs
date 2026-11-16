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
  // WF-040: opening the form moves focus into its first field.
  assert.ok(await doc.getByLabel('Nome e cognome').evaluate(el => el === document.activeElement));
  await doc.getByLabel('Nome e cognome').fill('Anna Verdi');
  await doc.getByLabel("Email dell'account Google").fill('anna@example.test');
  await doc.getByRole('button', { name: 'Crea invito' }).click();
  await doc.getByRole('heading', { name: 'Anna Verdi aggiunto' }).waitFor();
  const inviteUrl = await doc.getByLabel('Link di invito').inputValue();
  assert.match(inviteUrl, /\/app\/join\?token=[\w-]{40,}$/);
  await doc.getByRole('button', { name: 'Chiudi' }).click();
  // WF-040: closing returns focus to the button that opened the form.
  assert.ok(await doc.getByRole('button', { name: '+ Nuovo paziente' }).evaluate(el => el === document.activeElement));
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
  // WF-040: the compliance progress bar carries an explicit text equivalent of its value.
  assert.equal(await row.locator('progress').getAttribute('aria-valuetext'), '100%');
  await doc.getByRole('button', { name: /Anna Verdi/ }).click();
  await doc.getByText(/Acqua: 1 bicchieri/).waitFor();
  assert.match(await doc.locator('.nutri-meals').innerText(), /Pane/);
  assert.equal(await doc.locator('.nutri-tick.done').count(), 1);
  assert.match(await doc.locator('.meal-heading .badge').innerText(), /1\/1/);
  // WF-040: the detail's day tabs follow the same tablist pattern as the shared DayPicker.
  assert.equal(await doc.getByRole('tab', { selected: true }).count(), 1);

  // A fresh patient session still sees the server plan without reimporting it.
  await anna.evaluate(() => localStorage.clear());
  await anna.reload();
  await anna.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  assert.match(await anna.locator('.meal-list').innerText(), /Pane/);
  assert.deepEqual(errors, []);
});

test('patient detail shows alternatives, converted units, import warnings and oil tracking (WF-038)', async t => {
  const f = await startFixture(); const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await f.close(); });
  f.store.assignRole('google-doc2', 'nutritionist');
  f.setIdentity({ sub: 'google-doc2', email: 'doc2@example.test', name: 'Doc' });
  const docLogin = await f.login();
  const docSession = await (await f.request('/api/session', { headers: { Cookie: docLogin.cookie } })).json();
  const asDoc = (route, body) => f.request(route, { method: 'POST', body: JSON.stringify(body),
    headers: { Cookie: docLogin.cookie, Origin: f.config.origin, 'X-CSRF-Token': docSession.csrf, 'Content-Type': 'application/json' } });
  const anna = await (await asDoc('/api/nutritionist/patients', { name: 'Anna Bruni', email: 'annab@example.test' })).json();

  const TODAY = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'][new Date().getDay()];
  const PLAN = { metadata: { quality: { warnings: ['Abbiamo letto 1 giorni su 7: controlla che il piano sia completo.'] } },
    days: { [TODAY]: { dayName: 'Oggi', meals: [
      { name: 'Pranzo', items: [
        { name: 'Riso', qty: '24 g', isConverted: true, rawQty: '3 cucchiai', conversionNote: '(coefficiente generico)' },
        { name: 'Riso oppure Pasta', qty: '80 g' },
        { name: "Olio extra vergine d'oliva", qty: '12 g' }
      ] }
    ] } } };
  const upload = await (await asDoc(`/api/nutritionist/patients/${anna.id}/plan`, { name: 'piano.pdf', data: PLAN })).json();

  // The patient ticks the oil row, so the detail shows it as used, not just planned.
  f.setIdentity({ sub: 'google-annab', email: 'annab@example.test', name: 'Anna' });
  const annaLogin = await f.login();
  const annaSession = await (await f.request('/api/session', { headers: { Cookie: annaLogin.cookie } })).json();
  await f.request('/api/tracking', { method: 'POST', body: JSON.stringify({ planId: upload.planId, day: TODAY, field: 'checked', value: { '0_2': true } }),
    headers: { Cookie: annaLogin.cookie, Origin: f.config.origin, 'X-CSRF-Token': annaSession.csrf, 'Content-Type': 'application/json' } });

  const docContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await docContext.addCookies([{ name: 'nutra_session', value: docLogin.cookie.split('=')[1], url: f.config.origin }]);
  const page = await docContext.newPage();
  await page.goto(f.config.origin + '/app/');
  await page.getByRole('button', { name: /Anna Bruni/ }).waitFor();
  await page.getByRole('button', { name: /Anna Bruni/ }).click();
  const detail = page.locator('.nutri-detail');
  await detail.locator('.nutri-meals').waitFor();
  const text = await detail.innerText();
  assert.match(text, /Abbiamo letto 1 giorni su 7/); // import quality warning
  assert.match(text, /3 cucchiai/); // original PDF unit shown
  assert.match(text, /= 24 g/); // conversion note alongside it
  assert.match(text, /oppure Pasta/); // alternative food
  assert.match(text, /Olio usato: 3 cucchiaini \(12 g\)/); // oil tracked by the patient, read-only here
});
