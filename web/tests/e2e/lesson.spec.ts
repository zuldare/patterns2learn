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

test.describe('first paint, before the lesson script runs', () => {
  test.beforeEach(async ({ page }) => {
    // Simulates the window between HTML parse and module execution.
    await page.route('**/_astro/*.js', r => r.abort());
  });

  test('shows only the first step and its diagram snapshot', async ({ page }) => {
    await page.goto('/en/patterns/strategy/');
    await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'problem');
    await expect(page.locator('.step-text:visible')).toHaveCount(1);
    await expect(page.locator('.step-text[data-step-id="problem"]')).toBeVisible();
    await expect(page.locator('.code-snippet:visible')).toHaveCount(1);
    const shown = await page.locator('.iso-entity:not(.is-hidden)').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.id).sort());
    expect(shown).toEqual(['athlete', 'controller', 'legacy']);
  });

  test('resolves a saved step', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem('p2l:progress', JSON.stringify({ lessons: { strategy: { step: 2, done: false } } })),
    );
    await page.goto('/en/patterns/strategy/');
    await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'interface');
    await expect(page.locator('.step-text:visible')).toHaveCount(1);
  });

  test('a valid hash wins over the saved step', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem('p2l:progress', JSON.stringify({ lessons: { strategy: { step: 2, done: false } } })),
    );
    await page.goto('/en/patterns/strategy/#step-extend');
    await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'extend');
  });
});

test('on a short viewport the sticky step panel keeps Next reachable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto('/en/patterns/strategy/#step-injection');
  await page.evaluate(() => window.scrollTo(0, 400));
  const panel = await page.locator('.step-panel').boundingBox();
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(600);
  const next = await page.locator('.step-panel [data-action="next"]').boundingBox();
  expect(next!.y + next!.height).toBeLessThanOrEqual(600);
  await page.click('.step-panel [data-action="next"]');
  await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', 'request');
});
