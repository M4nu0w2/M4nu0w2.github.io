const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');

function fixturePdf() {
  const stream = 'BT /F1 12 Tf 1 0 0 1 40 760 Tm (Luned\\354) Tj ET\nBT /F1 12 Tf 1 0 0 1 260 730 Tm (Pranzo) Tj ET\nBT /F1 12 Tf 1 0 0 1 78 700 Tm (Pane) Tj 1 0 0 1 393 700 Tm (50 g) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let body = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(body)); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body);
}

test('bundled PDF worker imports real PDF bytes without external requests or CSP violations', async t => {
  const fixture = await startFixture(); const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await fixture.close(); });
  const context = await browser.newContext(); const login = await fixture.login();
  await context.addCookies([{ name: 'nutripro_session', value: login.cookie.split('=')[1], url: fixture.config.origin }]);
  const page = await context.newPage(); const external = [], errors = [];
  page.on('request', request => { if (!request.url().startsWith(fixture.config.origin)) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { window.violations = []; document.addEventListener('securitypolicyviolation', event => window.violations.push(event.violatedDirective)); });
  await page.goto(fixture.config.origin);
  await page.getByRole('button', { name: 'Carica il tuo PDF' }).click();
  await page.getByLabel('PDF del piano').setInputFiles({ name: 'Piano ottobre.pdf', mimeType: 'application/pdf', buffer: fixturePdf() });
  await page.getByRole('button', { name: 'Importa e attiva' }).click();
  await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();
  const archive = await page.evaluate(() => JSON.parse(localStorage.getItem('diet_plan_archive:google-user-1')));
  assert.equal(archive.plans[0].data.days.lun.meals[0].items[0].name, 'Pane');
  assert.equal(archive.plans[0].data.days.lun.meals[0].items[0].qty, '50 g');
  assert.deepEqual(external, []); assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.violations), []);
});
