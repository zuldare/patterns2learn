import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

const lessonSlugs = readdirSync(fileURLToPath(new URL('../../src/content/lessons', import.meta.url))).filter(s => !s.startsWith('_'));

for (const slug of lessonSlugs) {
  test(`${slug}: cheatsheet draws its UML structure`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()));
    await page.goto(`/es/patterns/${slug}/cheatsheet/`);
    const uml = page.locator('.sheet__uml [data-uml]');
    await expect(uml).toHaveAttribute('data-rendered', 'true', { timeout: 15_000 });
    await expect(uml.locator('svg')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('the lesson header shows the intent, then the application', async ({ page }) => {
  await page.goto('/es/patterns/abstract-factory/');
  const terms = page.locator('.lesson__lede dt');
  await expect(terms).toHaveText(['Intención', 'Aplicación']);
  await expect(page.locator('.lesson__application dd')).toContainText('Fran no es igual');
});
