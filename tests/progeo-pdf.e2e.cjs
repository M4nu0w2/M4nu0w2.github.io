// Private PDF remains outside the repository. No document contents are sent to a CDN.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pdfPath = process.env.REAL_PROGEO_PDF;
const assetDir = process.env.PDFJS_ASSET_DIR;
if (!pdfPath || !assetDir) throw new Error('Set REAL_PROGEO_PDF and PDFJS_ASSET_DIR for the private reference PDF and pdf.js 3.11.174 assets.');

test('real reference PDF: appendix links, complete recipes, accurate shopping totals, reload', async () => {
  const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://cdnjs.cloudflare.com; worker-src blob: https://cdnjs.cloudflare.com; manifest-src data:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'";
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': csp });
    res.end(fs.readFileSync('index.html'));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(event.violatedDirective));
    });
    await page.route('https://**/*', async route => {
      const url = route.request().url();
      if (/\/pdf(?:\.worker)?\.min\.js$/.test(url)) {
        await route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(assetDir, url.split('/').pop())) });
      } else await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.locator('#pdf-file-input').setInputFiles(pdfPath);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('diet_plan_data') || 'null')?.metadata.alternativesImported, { timeout: 15000 });
    const data = await page.evaluate(() => JSON.parse(localStorage.getItem('diet_plan_data')));
    const assigned = Object.values(data.days).flatMap(day => day.meals.flatMap(meal => meal.items));
    const coded = assigned.filter(item => item.alternativeCode);
    assert.ok(coded.length > 30);
    assert.ok(coded.every(item => item.alternatives?.length));
    assert.equal(Object.values(data.days).filter(day => day.meals.length > 0).length, 7);
    assert.ok(data.days.lun.meals.some(meal => meal.name === 'Pasto aggiuntivo 1'));
    const oilTotal = assigned.filter(item => item.name === 'Olio extra vergine di oliva').reduce((sum, item) => sum + parseFloat(item.qty), 0);
    assert.equal(oilTotal, 156);
    const oatTotal = assigned.filter(item => item.name === "Fiocchi d'avena").reduce((sum, item) => sum + parseFloat(item.qty), 0);
    assert.equal(oatTotal, 60);
    assert.equal(data.metadata.unitMeasures['fagioli di soia secchi'].spoonGrams, 16);
    await page.getByRole('button', { name: 'Esporta lista della spesa', exact: true }).click();
    const preview = await page.locator('#shopping-preview').inputValue();
    assert.ok(preview.includes('Vitello magro — 300 g oppure Coscia di tacchino — 270 g oppure Coscia di pollo — 240 g'));
    assert.ok(preview.includes('Nasello — 300 g oppure Platessa — 290 g'));
    assert.ok(preview.includes('Acciughe — 300 g oppure Alici — 300 g'));
    assert.ok(preview.includes('Riso integrale con le seppie (Riso integrale — 150 g + Seppie — 50 g)'));
    assert.ok(preview.includes('Uovo di gallina — 4 pezzi oppure Frittata (Uovo di gallina — 4 pezzi)'));
    assert.ok(preview.includes('Olio extra vergine di oliva — 156 g'));
    assert.ok(preview.includes("Fiocchi d'avena — 60 g"));
    assert.ok(preview.includes('Pane integrale — 550 g'));
    assert.ok(preview.includes('Mirtilli — 140 g'));
    assert.ok(preview.includes('Semi di sesamo — 36 g'));
    assert.ok(preview.includes('Parmigiano grattugiato — 40 g'));
    assert.ok(!preview.includes('Pasto aggiuntivo 1 —'));
    assert.ok(!preview.includes('quantità non indicata'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(os.tmpdir(), 'nutripro-real-shopping.png') });
    await page.reload();
    await page.getByRole('button', { name: 'Esporta lista della spesa', exact: true }).click();
    assert.equal(await page.locator('#shopping-preview').inputValue(), preview);
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
    await context.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
