const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

for (const theme of ['light', 'dark']) {
  test(`index has no axe violations and no console errors (${theme})`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => v.id + ': ' + v.nodes.length + ' node(s)')).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const [name, size] of [['desktop', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]]) {
  test(`screenshot ${name}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  });
}

test('terminal answers help and replays the lab', async ({ page }) => {
  await page.goto('/');
  await page.fill('#term-input', 'help');
  await page.press('#term-input', 'Enter');
  await expect(page.locator('#term-screen')).toContainText('replay wazuh');
});

test('mobile: no sideways scroll and no axe violations', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});
