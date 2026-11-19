import { ICON_NAMES, decal, faceMatrix, iconMarkup, isIconName } from '../../src/engine/icons';
import { project } from '../../src/engine/iso';

const apply = (m: string, u: number, v: number) => {
  const [a, b, c, d, e, f] = m.match(/matrix\(([^)]+)\)/)![1].split(' ').map(Number);
  return { sx: a * u + c * v + e, sy: b * u + d * v + f };
};
const box = { x: 1, y: 2, z: 0.25, w: 1, d: 1, h: 0.6 };

test('every icon renders token-only markup', () => {
  for (const name of ICON_NAMES) {
    const svg = iconMarkup(name);
    expect(svg.length).toBeGreaterThan(20);
    expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(|NaN/i);
  }
});
test('isIconName accepts the catalogue only', () => {
  expect(isIconName('gear')).toBe(true);
  expect(isIconName('rocket')).toBe(false);
  expect(isIconName(3)).toBe(false);
});
test.each([
  ['top', [0, 0], { x: 1, y: 2, z: 0.85 }], ['top', [1, 1], { x: 2, y: 3, z: 0.85 }],
  ['left', [0, 0], { x: 1, y: 3, z: 0.85 }], ['left', [1, 1], { x: 2, y: 3, z: 0.25 }],
  ['right', [0, 0], { x: 2, y: 3, z: 0.85 }], ['right', [1, 1], { x: 2, y: 2, z: 0.25 }],
] as const)('faceMatrix %s maps unit corner %j onto the box', (face, [u, v], p) => {
  const got = apply(faceMatrix(face, box), u, v);
  const want = project(p);
  expect(got.sx).toBeCloseTo(want.sx, 1);
  expect(got.sy).toBeCloseTo(want.sy, 1);
});
test('decal wraps the body in a transformed fig-decal group', () => {
  expect(decal('top', box, '<circle/>', 'fig-icon')).toMatch(/^<g class="fig-decal fig-icon" transform="matrix\([^"]+\)"><circle\/><\/g>$/);
});
test('catalogue includes the WOD board and the timer', () => {
  expect(ICON_NAMES).toContain('board');
  expect(ICON_NAMES).toContain('timer');
});
test('catalogue includes the proxy shield and the database', () => {
  expect(ICON_NAMES).toContain('shield');
  expect(ICON_NAMES).toContain('db');
});
test('catalogue includes the file icon', () => {
  expect(ICON_NAMES).toContain('file');
});
test('catalogue includes the bell and the medal', () => {
  expect(ICON_NAMES).toContain('bell');
  expect(ICON_NAMES).toContain('medal');
});
