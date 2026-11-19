// Generates public/og.png (1200x630) from the Strategy scene's `recap` step.
// Usage: pnpm -C web og   (needs a system `chromium`; set CHROMIUM=/path to override)
// The image is committed; re-run only when the scene or the brand changes.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// vite is Astro's own dependency; resolve it from there instead of adding a direct one.
const astroRequire = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { createServer } = await import(astroRequire.resolve('vite'));
const vite = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { renderScene } = await vite.ssrLoadModule('/src/engine/render.ts');
const { default: scene } = await vite.ssrLoadModule('/src/content/lessons/strategy/scene.ts');
await vite.close();

// Keep only what the recap step shows, as the lesson player does.
const step = scene.steps.find((s) => s.id === 'recap');
const visible = new Set(step.visible);
const svg = renderScene({
  ...scene,
  entities: scene.entities.filter((e) => visible.has(e.id)),
  links: scene.links.filter((l) => visible.has(l.from) && visible.has(l.to)),
});

// Paper tokens inlined as :root vars, so the same engine.css styles the raster.
const tokens = read('src/styles/tokens.css');
const paper = tokens.match(/:root\[data-theme="paper"\]\s*\{[^}]*\}/)[0].replace(':root[data-theme="paper"]', ':root');
const html = `<!doctype html><meta charset="utf-8"><style>
${tokens.match(/:root\s*\{[^}]*\}/)[0]}
${paper}
${read('src/styles/engine.css')}
@font-face { font-family: "IBM Plex Mono"; font-weight: 700; src: url("${pathUrl('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff2')}"); }
@font-face { font-family: "IBM Plex Mono"; font-weight: 600; src: url("${pathUrl('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2')}"); }
@font-face { font-family: "IBM Plex Mono"; font-weight: 400; src: url("${pathUrl('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}"); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body {
  font-family: var(--font); color: var(--ink); background-color: var(--bg);
  background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 32px 32px;
  display: grid; grid-template-columns: 480px 1fr; align-items: center; gap: 24px; padding: 0 56px;
}
h1 { white-space: nowrap; font-size: 46px; line-height: 1.05; letter-spacing: -0.02em; }
h1 span { display: inline-block; margin: 0 4px; padding: 0 12px; background: var(--accent); border: 3px solid var(--ink); border-radius: 999px; box-shadow: var(--pop-shadow); }
p { margin-top: 20px; font-size: 24px; line-height: 1.35; font-weight: 500; max-width: 400px; text-wrap: balance; }
.iso-scene { width: 640px; height: auto; }
.iso-scene text { font-size: 11px; }
</style>
<div><h1>patterns<span>2</span>learn</h1><p>Design patterns, the Spring Boot way</p></div>
<div>${svg}</div>`;

function pathUrl(p) { return 'file://' + resolve(root, p); }

const dir = mkdtempSync(join(tmpdir(), 'p2l-og-'));
const page = join(dir, 'og.html');
writeFileSync(page, html);
execFileSync(process.env.CHROMIUM || 'chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
  '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=3000',
  `--screenshot=${resolve(root, 'public/og.png')}`, 'file://' + page,
], { stdio: 'inherit' });
console.log('wrote public/og.png');
