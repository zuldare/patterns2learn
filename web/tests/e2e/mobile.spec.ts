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
