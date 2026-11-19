import css from '../../src/styles/tokens.css?raw';
import { contrastRatio, luminance, readTokens } from '../../src/lib/contrast';
for (const theme of ['paper', 'blueprint'] as const) {
  const t = readTokens(css, theme);
  test(`${theme}: ink on bg/surface ≥ 4.5`, () => {
    expect(contrastRatio(t['--ink'], t['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t['--ink'], t['--surface'])).toBeGreaterThanOrEqual(4.5);
  });
  test(`${theme}: muted and accent-ink on surface ≥ 4.5`, () => {
    expect(contrastRatio(t['--muted'], t['--surface'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t['--accent-ink'], t['--accent-soft'])).toBeGreaterThanOrEqual(4.5);
  });
  test(`${theme}: accent-strong as graphic on bg/surface ≥ 3`, () => {
    expect(contrastRatio(t['--accent-strong'], t['--bg'])).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(t['--accent-strong'], t['--surface'])).toBeGreaterThanOrEqual(3);
  });
  test(`${theme}: recess (shadows, holes) is darker than bg and surface`, () => {
    expect(luminance(t['--recess'])).toBeLessThan(luminance(t['--bg']));
    expect(luminance(t['--recess'])).toBeLessThan(luminance(t['--surface']));
  });
}
test('known ratio', () => expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1));

/** Resolves `#hex`, `var(--x)` and `color-mix(in srgb, A N%, B)` against a theme's tokens. */
function resolveColour(value: string, t: Record<string, string>): string {
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  const ref = /^var\((--[\w-]+)\)$/.exec(v);
  if (ref) return resolveColour(t[ref[1]!] ?? '', t);
  const mix = /^color-mix\(in srgb,\s*(var\(--[\w-]+\))\s+(\d+)%,\s*(var\(--[\w-]+\))\)$/.exec(v);
  if (mix) {
    const a = resolveColour(mix[1]!, t);
    const b = resolveColour(mix[3]!, t);
    const p = Number(mix[2]) / 100;
    const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return `#${[0, 1, 2]
      .map((i) => Math.round(ch(a, i) * p + ch(b, i) * (1 - p)).toString(16).padStart(2, '0'))
      .join('')}`;
  }
  throw new Error(`Unresolvable colour: ${value}`);
}

for (const theme of ['paper', 'blueprint'] as const) {
  const t = readTokens(css, theme);
  const shiki = Object.keys(t).filter((k) => k.startsWith('--shiki-') && k !== '--shiki-background');
  test(`${theme}: defines the shiki token colours`, () => {
    expect(shiki).toEqual(expect.arrayContaining(['--shiki-foreground', '--shiki-token-keyword', '--shiki-token-string', '--shiki-token-comment']));
  });
  test.each(shiki)(`${theme}: %s readable on surface and highlighted line ≥ 4.5`, (k) => {
    expect(t[k]).toMatch(/var\(--/); // derived from the palette, never a loose hex
    const fg = resolveColour(t[k]!, t);
    expect(contrastRatio(fg, t['--surface']!)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(fg, resolveColour(t['--code-hl']!, t))).toBeGreaterThanOrEqual(4.5);
  });
}

for (const theme of ['paper', 'blueprint'] as const) {
  const t = readTokens(css, theme);
  test(`${theme}: text on accent fill ≥ 4.5`, () => {
    expect(contrastRatio(resolveColour(t['--on-accent']!, t), t['--accent']!)).toBeGreaterThanOrEqual(4.5);
  });
}
