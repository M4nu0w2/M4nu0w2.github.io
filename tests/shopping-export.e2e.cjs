// Run with PLAYWRIGHT_MODULE pointing to an existing Playwright installation.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');

test('mobile export: preview, day selection, clipboard, download, cancel and persistence', async () => {
  const fixture = await startFixture();
  const browser = await chromium.launch({ headless: true });
  try {
    const origin = fixture.config.origin;
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const login = await fixture.login();
    await context.addCookies([{ name: 'nutripro_session', value: login.cookie.split('=')[1], url: origin }]);
    const page = await context.newPage();
    const errors = [];
    const violations = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(event.violatedDirective));
    });
    await page.route('https://**/*', route => route.fulfill({ status: 200,
      contentType: route.request().url().endsWith('.js') ? 'application/javascript' : 'text/css', body: '' }));
    await page.goto(origin);
    await page.getByRole('button', { name: 'Carica il tuo PDF', exact: true }).click();
  await page.getByRole('button', { name: /Carica Piano di Prova Progeo/i }).click();
  await page.getByRole('button', { name: 'Importa e attiva', exact: true }).click();
    const snapshot = await page.evaluate(() => localStorage.getItem('diet_plan_archive:google-user-1'));
    await page.getByRole('button', { name: 'Esporta lista della spesa', exact: true }).click();
    const dialog = page.getByRole('dialog');
    assert.ok(await dialog.isVisible());
    assert.equal(await page.getByRole('button', { name: 'Condividi', exact: true }).isVisible(), false);
    assert.equal(await dialog.getByRole('checkbox').count(), 7);
    assert.ok((await page.locator('#shopping-preview').inputValue()).includes('oppure'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.screenshot({ path: path.join(os.tmpdir(), 'nutripro-shopping-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Copia lista', exact: true }).click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'), await page.locator('#shopping-preview').inputValue());
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Scarica .txt', exact: true }).click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), 'lista-spesa-nutripro.txt');
    assert.equal(fs.readFileSync(await download.path(), 'utf8'), await page.locator('#shopping-preview').inputValue());
    for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.uncheck();
    assert.equal(await page.locator('#shopping-preview').inputValue(), '');
    assert.equal(await page.getByRole('button', { name: 'Copia lista', exact: true }).isDisabled(), true);
    await dialog.getByRole('checkbox', { name: 'Lunedì' }).check();
    const monday = await page.locator('#shopping-preview').inputValue();
    assert.ok(monday.includes('oppure'));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
    await page.getByRole('button', { name: 'Copia lista', exact: true }).click();
    await page.locator('#shopping-status').filter({ hasText: 'Copia non disponibile' }).waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.selectionEnd), monday.length);
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-export-shopping');
    assert.equal(await page.evaluate(() => localStorage.getItem('diet_plan_archive:google-user-1')), snapshot);
    await page.reload();
    assert.equal(await page.evaluate(() => localStorage.getItem('diet_plan_archive:google-user-1')), snapshot);
    await page.getByRole('button', { name: 'Esporta lista della spesa', exact: true }).click();
    assert.ok((await page.locator('#shopping-preview').inputValue()).includes('oppure'));
    await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
    await page.evaluate(() => { navigator.share = async data => { window.sharedShopping = data; }; });
    await page.getByRole('button', { name: 'Esporta lista della spesa', exact: true }).click();
    await page.getByRole('button', { name: 'Condividi', exact: true }).click();
    assert.equal(await page.evaluate(() => window.sharedShopping.text), await page.locator('#shopping-preview').inputValue());
    await page.evaluate(() => { navigator.share = async () => { throw Object.assign(new Error('cancel'), { name: 'AbortError' }); }; });
    await page.getByRole('button', { name: 'Condividi', exact: true }).click();
    assert.ok(await dialog.isVisible());
    await page.evaluate(() => { navigator.share = async () => { throw new Error('unavailable'); }; });
    await page.getByRole('button', { name: 'Condividi', exact: true }).click();
    await page.locator('#shopping-status').filter({ hasText: 'Usa Copia lista' }).waitFor();
    violations.push(...await page.evaluate(() => window.cspViolations));
    assert.deepEqual(errors, []);
    assert.deepEqual(violations, []);
    await context.close();
  } finally {
    await browser.close();
    await fixture.close();
  }
});
