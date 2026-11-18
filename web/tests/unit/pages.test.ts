import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const webRoot = resolve(__dirname, '../..');

test('build emits both locales with hreflang, step sections and svg', async () => {
  execSync('pnpm astro build', { cwd: webRoot, env: { ...process.env, P2L_FIXTURES: '1' } });
  for (const lang of ['es', 'en']) {
    const html = readFileSync(`${webRoot}/dist/${lang}/patterns/demo/index.html`, 'utf8');
    expect(html).toContain(`<html lang="${lang}"`);
    expect(html).toContain('hreflang="es"'); expect(html).toContain('hreflang="en"');
    expect(html.match(/class="step-text"/g)?.length).toBe(6);
    expect(html).toContain('<svg'); expect(html).toContain('role="img"');
    expect(html).toContain('var(--shiki-');
  }
  expect(readFileSync(`${webRoot}/dist/index.html`, 'utf8')).toContain('<noscript>');
}, 120_000);
