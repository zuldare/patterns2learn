import { test, expect } from '@playwright/test';

const titles = { es: 'Strategy', en: 'Strategy' } as const;

for (const lang of ['es', 'en'] as const) {
  const url = `/${lang}/patterns/strategy/cheatsheet/`;

  test(`${lang}: cheatsheet renders and has no horizontal overflow`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('h1.sheet__title')).toContainText(titles[lang]);
    await expect(page.locator('.sheet__intent')).toBeVisible();
    await expect(page.locator('.sheet__intent p')).not.toBeEmpty();
    await expect(page.locator('.code-snippet')).toBeVisible();
    await expect(page.locator('[data-action="print"]')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`${lang}: lesson links to the cheatsheet`, async ({ page }) => {
    await page.goto(`/${lang}/patterns/strategy/`);
    const link = page.locator('.step-text__sheet a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', url);
  });
}
