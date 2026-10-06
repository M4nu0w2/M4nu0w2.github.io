const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { startFixture } = require('./auth-fixture.cjs');

const iphone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}

test('mobile layout keeps a compact header, a bottom tab bar and one row of days', async t => {
  const fixture = await startFixture(); const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await fixture.close(); });
  const context = await browser.newContext(iphone); const login = await fixture.login();
  await context.addCookies([{ name: 'nutripro_session', value: login.cookie.split('=')[1], url: fixture.config.origin }]);
  const page = await context.newPage();
  await page.goto(fixture.config.origin);
  await page.getByRole('button', { name: 'Carica il tuo PDF' }).click();
  await page.getByRole('button', { name: 'Carica Piano di Prova Progeo' }).click();
  await page.getByRole('button', { name: 'Importa e attiva' }).click();
  await page.getByRole('heading', { name: 'Il menu di oggi' }).waitFor();

  const header = await page.locator('.topbar').boundingBox();
  assert.ok(header.height <= 72, `header height ${header.height}`);
  const nav = page.getByRole('navigation', { name: 'Navigazione principale' });
  const bar = await nav.boundingBox();
  assert.equal(Math.round(bar.y + bar.height), 844);

  const days = page.getByRole('group', { name: 'Giorno del piano' }).getByRole('button');
  assert.equal(await days.count(), 7);
  const rows = new Set(await days.evaluateAll(buttons => buttons.map(button => Math.round(button.getBoundingClientRect().top))));
  assert.equal(rows.size, 1);
  await page.getByRole('button', { name: 'Mercoledì' }).click();
  assert.equal(await page.getByRole('button', { name: 'Mercoledì' }).getAttribute('aria-pressed'), 'true');

  const grid = await page.locator('.stats-grid').boundingBox();
  const orphan = await page.locator('.stats-grid > :last-child').boundingBox();
  assert.equal(Math.round(orphan.width), Math.round(grid.width));
  assert.ok(await noHorizontalScroll(page));

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  assert.equal(Math.round((await nav.boundingBox()).y), Math.round(bar.y));
  assert.equal(Math.round((await page.locator('.topbar').boundingBox()).y), 0);
  const lastCard = await page.locator('.water-card').boundingBox();
  assert.ok(lastCard.y + lastCard.height <= bar.y, 'last card hidden behind the tab bar');

  for (const route of ['/plans', '/chat']) {
    await page.goto(fixture.config.origin + route);
    await nav.waitFor();
    assert.ok(await noHorizontalScroll(page), `horizontal scroll on ${route}`);
  }
});
