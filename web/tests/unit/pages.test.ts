import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const webRoot = resolve(__dirname, '../..');

test('build emits both locales with hreflang, step sections and svg', async () => {
  execSync('pnpm astro build', { cwd: webRoot, env: { ...process.env, P2L_FIXTURES: '1' } });
  for (const lang of ['es', 'en']) {
    const html = readFileSync(`${webRoot}/dist/${lang}/patterns/demo/index.html`, 'utf8');
    expect(html).toContain(`<html lang="${lang}"`);
    expect(html).toContain('rel="alternate" hreflang="es"'); expect(html).toContain('rel="alternate" hreflang="en"');
    expect(html.match(/class="step-text"/g)?.length).toBe(6);
    expect(html).toContain('<svg'); expect(html).toContain('role="img"');
    expect(html).toContain('var(--shiki-');
  }
  expect(readFileSync(`${webRoot}/dist/index.html`, 'utf8')).toContain('<noscript>');
}, 120_000);

test('SEO and a11y basics on strategy pages', () => {
  const html = readFileSync(`${webRoot}/dist/es/patterns/strategy/index.html`, 'utf8');
  expect(html).toMatch(/<link rel="canonical" href="https:\/\/patterns2learn\.vercel\.app\/es\/patterns\/strategy\/?"/);
  expect(html).toContain('hreflang="x-default" href="https://patterns2learn.vercel.app/"');
  expect(html).toContain('property="og:image" content="https://patterns2learn.vercel.app/og.png"');
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  expect(html).toContain('rel="icon"');
  expect(html).toMatch(/aria-describedby="describe-problem"/);
  expect(existsSync(`${webRoot}/dist/sitemap-index.xml`)).toBe(true);
  expect(existsSync(`${webRoot}/dist/og.png`)).toBe(true);
  expect(readFileSync(`${webRoot}/dist/robots.txt`, 'utf8')).toContain('Sitemap: https://patterns2learn.vercel.app/sitemap-index.xml');
  const root = readFileSync(`${webRoot}/dist/index.html`, 'utf8');
  expect(root).not.toContain('rel="canonical"');
  expect(root).toContain('hreflang="x-default" href="https://patterns2learn.vercel.app/"');
});

test('home lists the start-here path with the finished lessons linked', () => {
  for (const lang of ['es', 'en']) {
    const home = readFileSync(`${webRoot}/dist/${lang}/index.html`, 'utf8');
    expect(home).toContain(`href="/${lang}/patterns/strategy/"`);
    expect(home).toContain(`href="/${lang}/patterns/singleton/"`);
    expect(home).toContain(`href="/${lang}/patterns/proxy/"`);
    expect(home).toContain(`href="/${lang}/patterns/template-method/"`);
    expect(home).toContain(`href="/${lang}/patterns/observer/"`);
    expect(home).toContain(`href="/${lang}/patterns/decorator/"`);
    expect(home).toContain(`href="/${lang}/patterns/chain-of-responsibility/"`);
    expect(home).toContain(`href="/${lang}/patterns/factory-method/"`);
    expect(home).toContain(lang === 'es' ? 'Empieza aquí' : 'Start here');
    const soonWord = lang === 'es' ? /Próximamente/g : /Coming soon/g;
    const start0 = home.slice(home.indexOf('class="start-here"'), home.indexOf('id="course-tree"'));
    expect(start0.match(soonWord)).toBeNull();
    const order = ['Singleton', 'Proxy', 'Template Method', 'Strategy', 'Observer', 'Decorator', 'Chain of Responsibility', 'Factory Method'];
    const start = home.slice(home.indexOf('class="start-here"'));
    const idx = order.map((n) => start.indexOf(n));
    expect(idx.every((i) => i > 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  }
});

test('course tree shows all 23 GoF patterns, unfinished ones as coming soon', async () => {
  const { listLessons } = await import('../../src/lib/lessons');
  const { CATALOG } = await import('../../src/lib/catalog');
  process.env.P2L_FIXTURES = '1'; // dist was built with the fixtures (the demo lesson sits outside the catalog)
  const slugs = (await listLessons()).map((l) => l.slug);
  delete process.env.P2L_FIXTURES;
  const inCatalog = slugs.filter((s) => CATALOG.some((p) => p.slug === s)).length;
  const done = inCatalog;
  const extra = slugs.length - inCatalog;
  for (const lang of ['es', 'en']) {
    for (const page of [`${lang}/index.html`, `${lang}/patterns/strategy/index.html`]) {
      const html = readFileSync(`${webRoot}/dist/${page}`, 'utf8');
      const tree = html.slice(html.indexOf('id="course-tree"'), html.indexOf('</aside>', html.indexOf('id="course-tree"')));
      expect(tree.match(/class="course-tree__item[ "]/g)?.length, page).toBe(23 + extra);
      expect(tree.match(/course-tree__item--soon/g)?.length ?? 0, page).toBe(23 - done);
      expect(tree.match(lang === 'es' ? /Próximamente/g : /Coming soon/g)?.length ?? 0, page).toBe(23 - done);
      for (const p of CATALOG) {
        expect(tree, p.name).toContain(`>${p.name}<`);
        const linked = tree.includes(`href="/${lang}/patterns/${p.slug}/"`);
        expect(linked, p.slug).toBe(slugs.includes(p.slug));
      }
    }
  }
});

test('donate placeholder URL is never published', () => {
  for (const page of ['es/index.html', 'en/patterns/strategy/index.html', 'es/patterns/strategy/cheatsheet/index.html']) {
    const html = readFileSync(`${webRoot}/dist/${page}`, 'utf8');
    expect(html, page).not.toContain('REPLACE_ME');
  }
});

test.each([
  ['strategy', 'behavioral'],
  ['singleton', 'creational'],
  ['proxy', 'structural'],
  ['template-method', 'behavioral'],
  ['observer', 'behavioral'],
  ['decorator', 'structural'],
  ['chain-of-responsibility', 'behavioral'],
  ['factory-method', 'creational'],
  ['builder', 'creational'],
  ['adapter', 'structural'],
  ['facade', 'structural'],
  ['composite', 'structural'],
  ['command', 'behavioral'],
  ['state', 'behavioral'],
  ['abstract-factory', 'creational'],
  ['iterator', 'behavioral'],
  ['mediator', 'behavioral'],
  ['prototype', 'creational'],
  ['visitor', 'behavioral'],
  ['bridge', 'structural'],
  ['memento', 'behavioral'],
  ['flyweight', 'structural'],
  ['interpreter', 'behavioral'],
])('%s lesson and cheatsheet link to the runnable example', (slug, category) => {
  const href = `href="https://github.com/zuldare/patterns2learn/tree/main/examples/${category}/${slug}"`;
  for (const lang of ['es', 'en']) {
    for (const page of [`${lang}/patterns/${slug}/index.html`, `${lang}/patterns/${slug}/cheatsheet/index.html`]) {
      const html = readFileSync(`${webRoot}/dist/${page}`, 'utf8');
      const link = html.match(new RegExp(`<a[^>]*${href}[^>]*>`))?.[0];
      expect(link, page).toBeDefined();
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener"');
      expect(html).toContain(lang === 'es' ? 'Ejecútalo' : 'Run it');
    }
  }
});
