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

test('home lists the start-here path with only Strategy linked', () => {
  for (const lang of ['es', 'en']) {
    const home = readFileSync(`${webRoot}/dist/${lang}/index.html`, 'utf8');
    expect(home).toContain(`href="/${lang}/patterns/strategy/"`);
    expect(home).toContain(lang === 'es' ? 'Empieza aquí' : 'Start here');
    expect(home.match(lang === 'es' ? /Próximamente/g : /Coming soon/g)?.length).toBe(7);
    const order = ['Singleton', 'Proxy', 'Template Method', 'Strategy', 'Observer', 'Decorator', 'Chain of Responsibility', 'Factory Method'];
    const start = home.slice(home.indexOf('class="start-here"'));
    const idx = order.map((n) => start.indexOf(n));
    expect(idx.every((i) => i > 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  }
});
