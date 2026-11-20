import { test, expect } from '@playwright/test';

for (const lang of ['es', 'en'])
  for (const theme of ['paper', 'blueprint', 'dark'])
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

test.describe('with motion enabled', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const [presses, step, packets] of [[5, 'request', 3], [6, 'extend', 0]] as const) {
    test(`rapid ArrowRight ×${presses} during packets settles on ${step} with ${packets} packet(s)`, async ({ page }) => {
      await page.goto('/en/patterns/strategy/');
      const lesson = page.locator('[data-lesson]');
      await lesson.focus();
      await expect(page.locator('.iso-packets > *')).toHaveCount(1); // step 1's packet is in flight
      for (let i = 0; i < presses; i++) await page.keyboard.press('ArrowRight', { delay: 40 });
      await expect(lesson).toHaveAttribute('data-step', step);
      // 3 packets × 600 ms play in sequence; wait past that, then the count must be exact.
      await page.waitForTimeout(2500);
      await expect(page.locator('.iso-packets > *')).toHaveCount(packets);
    });
  }
});

test('the theme button cycles paper → blueprint → dark → paper and remembers it', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('p2l:theme', '"paper"'); sessionStorage.setItem('seeded', '1'); } });
  await page.goto('/es/patterns/strategy/');
  const html = page.locator('html');
  const btn = page.locator('[data-action="toggle-theme"]');
  await expect(html).toHaveAttribute('data-theme', 'paper');
  await expect(btn).toContainText('Tema blueprint');
  await btn.click();
  await expect(html).toHaveAttribute('data-theme', 'blueprint');
  await expect(btn).toContainText('Tema oscuro');
  await btn.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(btn).toContainText('Tema papel');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await btn.click();
  await expect(html).toHaveAttribute('data-theme', 'paper');
});

for (const width of [1440, 375])
  test(`no step text overflows its panel sideways, in any lesson or language (${width}px)`, async ({ page }) => {
    test.setTimeout(360_000);   // walks every step of every lesson in two languages; grows with the course
    const { readdirSync } = await import('node:fs');
    const slugs = readdirSync('src/content/lessons').filter((d) => !d.startsWith('_'));
    await page.setViewportSize({ width, height: 900 });
    const offenders: string[] = [];
    for (const lang of ['es', 'en'])
      for (const slug of slugs) {
        await page.goto(`/${lang}/patterns/${slug}/`);
        const ids = await page.locator('.step-text').evaluateAll((els) => els.map((e) => e.getAttribute('data-step-id')));
        for (const id of ids) {
          await page.evaluate((step) => { location.hash = `step-${step}`; }, id);
          await expect(page.locator(`.step-text[data-step-id="${id}"]`)).toBeVisible();
          const over = await page.locator('.step-panel').evaluate((p) => p.scrollWidth - p.clientWidth);
          if (over > 1) offenders.push(`${lang}/${slug}#${id} (+${over}px)`);
        }
      }
    expect(offenders).toEqual([]);
  });

test('the sticky step panel never covers the quiz, which sits in its own card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/patterns/strategy/');
  const quiz = page.locator('.quiz-section');
  for (const target of ['.quiz-section__title', '.quiz-q:nth-of-type(2)', '.quiz__actions']) {
    await page.locator(target).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
    const panel = await page.locator('.step-panel').boundingBox();
    const q = await quiz.boundingBox();
    const overlap = panel && q
      && panel.x < q.x + q.width && q.x < panel.x + panel.width
      && panel.y < q.y + q.height && q.y < panel.y + panel.height;
    expect(overlap, `step panel overlaps the quiz at ${target}`).toBeFalsy();
  }
  const card = await quiz.evaluate((el) => {
    const s = getComputedStyle(el);
    return { border: parseFloat(s.borderTopWidth), bg: s.backgroundColor };
  });
  expect(card.border).toBeGreaterThan(0);
  expect(card.bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('the course tree is a card whose course and categories fold, remembering what was folded', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/patterns/strategy/');
  const tree = page.locator('#course-tree');
  const card = await tree.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
  expect(card).toBeGreaterThan(0);

  const creational = tree.locator('details[data-tree-key="creational"]');
  const builder = tree.locator('a[data-lesson-link="builder"]');
  await expect(builder).toBeVisible();
  await creational.locator('summary').click();                      // fold one category
  await expect(builder).toBeHidden();
  await expect(tree.locator('a[data-lesson-link="strategy"]')).toBeVisible();

  await tree.locator('details[data-tree-key="behavioral"] > summary').click();   // fold the current lesson's category
  await page.reload();
  await expect(builder).toBeHidden();                                           // remembered
  await expect(tree.locator('a[data-lesson-link="strategy"]')).toBeVisible();   // but the current one opens again

  await tree.locator('details[data-tree-key="root"] > summary').click();        // fold the whole course
  await expect(tree.locator('a[data-lesson-link="strategy"]')).toBeHidden();
  await tree.locator('details[data-tree-key="root"] > summary').click();
  await expect(tree.locator('a[data-lesson-link="strategy"]')).toBeVisible();
});

test('the camera frames each step without changing the canvas height', async ({ page }) => {
  await page.goto('/es/patterns/bridge/');
  const svg = page.locator('.iso-scene');
  const read = async () => svg.evaluate((el) => ({
    vb: el.getAttribute('viewBox')!.split(' ').map(Number),
    full: el.getAttribute('data-full-view')!.split(' ').map(Number),
    h: Math.round(el.getBoundingClientRect().height),
  }));
  const first = await read();
  expect(first.vb[2]).toBeLessThan(first.full[2]);                         // step 1 is zoomed in
  expect(first.vb[2] / first.vb[3]).toBeCloseTo(first.full[2] / first.full[3], 2);
  await page.evaluate(() => { location.hash = 'step-recap'; });
  await expect.poll(async () => (await read()).vb[2]).toBeGreaterThan(first.vb[2]);   // the recap shows more
  expect((await read()).h).toBe(first.h);
});

for (const width of [320, 768, 1024, 1280, 1920])
  test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/es/', '/en/', '/es/patterns/bridge/', '/es/patterns/interpreter/', '/en/patterns/chain-of-responsibility/', '/es/patterns/bridge/cheatsheet/']) {
      await page.goto(path);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, path).toBeLessThanOrEqual(0);
    }
  });
