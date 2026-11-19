import { test, expect } from '@playwright/test';

for (const lang of ['es', 'en'])
  for (const theme of ['paper', 'blueprint'])
    test(`${lang}/${theme}: walk all steps with keyboard`, async ({ page }) => {
      await page.addInitScript(t => localStorage.setItem('p2l:theme', JSON.stringify(t)), theme);
      await page.goto(`/${lang}/patterns/strategy/`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const lesson = page.locator('[data-lesson="strategy"]');
      await lesson.focus();
      for (let i = 1; i < 9; i++) await page.keyboard.press('ArrowRight');
      await expect(lesson).toHaveAttribute('data-step', 'recap');
      await expect(page.locator('.step-text[data-step-id="recap"]')).toBeVisible();
      await expect(page.locator('.step-text[data-step-id="problem"]')).toBeHidden();
    });

test('progress survives reload', async ({ page }) => {
  await page.goto('/en/patterns/strategy/');
  await page.click('[data-action="next"]');
  await page.click('[data-action="next"]');
  await page.reload();
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'interface');
});

test('works with storage blocked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  await page.goto('/en/patterns/strategy/');
  await page.click('[data-action="next"]');
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'smell');
  expect(errors).toEqual([]);
});

test('root redirects by browser language', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'es-ES' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page).toHaveURL(/\/es\/$/);
  await ctx.close();
});

test('arrow keys on quiz radios move the selection, not the lesson step', async ({ page }) => {
  await page.goto('/en/patterns/strategy/');
  const lesson = page.locator('[data-lesson]');
  await expect(lesson).toHaveAttribute('data-step', 'problem');
  const first = page.locator('input[name="q0"]').first();
  await first.check();
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await expect(lesson).toHaveAttribute('data-step', 'problem');
  await expect(page.locator('input[name="q0"]').nth(1)).toBeChecked();
  await expect(page.locator('input[name="q0"]').nth(1)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(lesson).toHaveAttribute('data-step', 'problem');
  await expect(page.locator('input[name="q0"]').nth(2)).toBeChecked();
});

test('a malformed #step- hash does not break the lesson', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/en/patterns/strategy/#step-%E0%A4%A');
  const lesson = page.locator('[data-lesson]');
  await expect(lesson).toHaveAttribute('data-step', 'problem');
  await page.click('[data-action="next"]');
  await expect(lesson).toHaveAttribute('data-step', 'smell');
  expect(errors).toEqual([]);
});

test('a #step- deep link opens that step', async ({ page }) => {
  await page.goto('/en/patterns/strategy/#step-injection');
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'injection');
  await expect(page.locator('.step-text[data-step-id="injection"]')).toBeVisible();
  await expect(page.locator('.step-text[data-step-id="problem"]')).toBeHidden();
});
