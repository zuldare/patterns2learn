import { test, expect } from '@playwright/test';

test('no horizontal scroll and collapsible code at 360px', async ({ page }) => {
  await page.goto('/es/patterns/strategy/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const code = page.locator('.code-panel');
  await expect(code).toHaveAttribute('data-open', 'false');
  await page.click('[data-action="toggle-code"]');
  await expect(code).toHaveAttribute('data-open', 'true');
  await page.click('[data-action="next"]');
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'smell');
});

test('code panel starts collapsed before the lesson script runs', async ({ page }) => {
  await page.route('**/_astro/*.js', r => r.abort());
  await page.goto('/es/patterns/strategy/');
  await expect(page.locator('.code-snippets')).toBeHidden();
});

test('without JS every step and the code are shown', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await page.goto('/es/patterns/strategy/');
  await expect(page.locator('[data-lesson]')).not.toHaveAttribute('data-step', /.+/);
  await expect(page.locator('.step-text:visible')).toHaveCount(9);
  await expect(page.locator('.code-snippets')).toBeVisible();
  await ctx.close();
});

test('on a phone the diagram keeps readable labels: the stage pans, the page does not', async ({ page }) => {
  await page.goto('/es/patterns/bridge/');
  const stage = page.locator('.iso-canvas__stage');
  const { pans, centred } = await stage.evaluate((s) => ({
    pans: s.scrollWidth > s.clientWidth,
    centred: Math.abs(s.scrollLeft - (s.scrollWidth - s.clientWidth) / 2) <= 2,
  }));
  expect(pans).toBe(true);
  expect(centred).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const label = await page.locator('.iso-entity:not(.is-hidden) .iso-label-text').first().evaluate((t) => t.getBoundingClientRect().height);
  expect(label).toBeGreaterThanOrEqual(9);
});
