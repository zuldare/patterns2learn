import css from '../../src/styles/tokens.css?raw';
import { contrastRatio, readTokens } from '../../src/lib/contrast';
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
}
test('known ratio', () => expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1));
