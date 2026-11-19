import { figureBox, figureCtx, figureMarkup, figureShape } from '../../src/engine/figures';
import type { Entity, Link } from '../../src/engine/types';

const ent = (p: Partial<Entity> & Pick<Entity, 'id' | 'kind'>): Entity => ({
  label: p.id, pos: { x: 0, y: 0, z: 0.25 }, size: { w: 1, d: 1, h: 0.6 }, tone: 'neutral', ...p,
});
const links: Link[] = [
  { id: 'a', from: 'm', to: 'i', style: 'implements' },
  { id: 'b', from: 't', to: 'i', style: 'implements' },
  { id: 'c', from: 's', to: 'i', style: 'injects' },
];
const dom = (svg: string) => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  g.innerHTML = svg;
  return g;
};
const plain = { slots: 0, isImplementation: false };

test('ctx counts implements links only', () => {
  expect(figureCtx(ent({ id: 'i', kind: 'interface' }), links)).toEqual({ slots: 2, isImplementation: false });
  expect(figureCtx(ent({ id: 'm', kind: 'block' }), links)).toEqual({ slots: 0, isImplementation: true });
  expect(figureCtx(ent({ id: 's', kind: 'block' }), links)).toEqual({ slots: 0, isImplementation: false });
});
test.each([
  ['actor', false, 'voxel'], ['container', false, 'platform'], ['interface', false, 'socket'],
  ['block', true, 'cartridge'], ['block', false, 'block'],
] as const)('%s (impl=%s) → %s', (kind, isImplementation, shape) => {
  expect(figureShape(ent({ id: 'x', kind }), { slots: 0, isImplementation })).toBe(shape);
});
test('block: lid, icon decal, leds; cables only when danger', () => {
  const g = dom(figureMarkup(ent({ id: 's', kind: 'block', icon: 'gear' }), plain));
  for (const c of ['figure-block', 'fig-lid', 'fig-icon', 'fig-leds']) expect(g.querySelector(`.${c}`)).not.toBeNull();
  expect(g.querySelector('.fig-cables')).toBeNull();
  const bad = dom(figureMarkup(ent({ id: 'l', kind: 'block', tone: 'danger' }), plain));
  expect(bad.querySelector('.fig-cables')).not.toBeNull();
  expect(bad.querySelector('.fig-icon')).toBeNull();
});
test('cartridge has contacts and its icon', () => {
  const g = dom(figureMarkup(ent({ id: 'm', kind: 'block', icon: 'calendar' }), { slots: 0, isImplementation: true }));
  expect(g.querySelector('.figure-cartridge .fig-contacts')).not.toBeNull();
  expect(g.querySelector('.fig-icon')).not.toBeNull();
});
test.each([0, 1, 4])('socket draws %i slots and no NaN', (slots) => {
  const svg = figureMarkup(ent({ id: 'i', kind: 'interface' }), { slots, isImplementation: false });
  expect(dom(svg).querySelectorAll('.fig-slot')).toHaveLength(slots);
  expect(svg).not.toContain('NaN');
});
test('voxel has a head; platform has the leaf badge', () => {
  expect(dom(figureMarkup(ent({ id: 'a', kind: 'actor' }), plain)).querySelector('.fig-head')).not.toBeNull();
  expect(dom(figureMarkup(ent({ id: 'c', kind: 'container', size: { w: 6, d: 5, h: 0.25 } }), plain)).querySelector('.fig-badge')).not.toBeNull();
});
test('shaded faces carry iso-face so highlight CSS reaches them', () => {
  for (const kind of ['actor', 'container', 'interface', 'block'] as const) {
    const g = dom(figureMarkup(ent({ id: 'x', kind, icon: kind === 'block' ? 'gear' : undefined }), { slots: 2, isImplementation: false }));
    expect(g.querySelectorAll('.iso-face').length).toBeGreaterThanOrEqual(3);
  }
});
test('cartridge box scales from size and stays centred (1.5 x 1.5 fixture block)', () => {
  const e = ent({ id: 't', kind: 'block', pos: { x: 4.5, y: 4, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 0.75 } });
  const b = figureBox(e, { slots: 0, isImplementation: true });
  expect(b.w).toBeCloseTo(1.05);
  expect(b.d).toBeCloseTo(0.675);
  expect(b.h).toBeCloseTo(1.2);
  expect(b.x + b.w / 2).toBeCloseTo(5.25);
  expect(b.y + b.d / 2).toBeCloseTo(4.75);
  expect(b.z).toBe(0.25);
});
test('no literal colours in any figure', () => {
  for (const kind of ['actor', 'container', 'interface', 'block'] as const) {
    expect(figureMarkup(ent({ id: 'x', kind, tone: 'danger' }), { slots: 3, isImplementation: false })).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(/i);
  }
});
test('socket draws its icon on the front instead of «i» when one is set', () => {
  const g = dom(figureMarkup(ent({ id: 'i', kind: 'interface', icon: 'key' }), { slots: 2, isImplementation: false }));
  expect(g.querySelector('.figure-socket .fig-icon')).not.toBeNull();
  expect(g.innerHTML).not.toContain('«i»');
});
