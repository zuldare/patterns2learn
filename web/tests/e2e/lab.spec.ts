import { expect, test } from '@playwright/test';

for (const theme of ['paper', 'blueprint', 'dark'] as const) {
  test(`lab gallery renders on ${theme} without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && !/favicon|_vercel\/insights/.test(m.text())) errors.push(m.text());
    });
    await page.goto(`/lab/figuras/?theme=${theme}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('[data-gallery="icons"] .iso-entity')).toHaveCount(11);
    await expect(page.locator('[data-gallery="figures"] .figure-socket').first()).toBeVisible();
    await expect(page.locator('.stage .iso-entity[data-id="iface"] .fig-slot')).toHaveCount(4);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    expect(errors).toEqual([]);
  });
}
test('step buttons toggle the scene', async ({ page }) => {
  await page.goto('/lab/figuras/');
  await page.getByRole('button', { name: /spring-does-it/ }).click();
  await expect(page.locator('.stage .iso-entity[data-id="encoder"]')).not.toHaveClass(/is-hidden/);
  await expect(page.locator('.stage .iso-entity[data-id="service"]')).toHaveClass(/is-hidden/);
});
