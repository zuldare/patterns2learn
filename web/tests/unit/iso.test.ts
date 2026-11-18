import { TILE_H, TILE_W, depth, project } from '../../src/engine/iso';
import type { Entity } from '../../src/engine/types';

test('tile constants', () => {
  expect(TILE_W).toBe(64);
  expect(TILE_H).toBe(32);
});
test('origin projects to 0,0', () => expect(project({ x: 0, y: 0 })).toEqual({ sx: 0, sy: 0 }));
test('x axis goes down-right, y axis down-left, z up', () => {
  expect(project({ x: 1, y: 0 })).toEqual({ sx: 32, sy: 16 });
  expect(project({ x: 0, y: 1 })).toEqual({ sx: -32, sy: 16 });
  expect(project({ x: 0, y: 0, z: 1 })).toEqual({ sx: 0, sy: -32 });
});
test('depth is x + y + z', () => {
  const e: Entity = { id: 'a', kind: 'block', label: 'A', pos: { x: 1, y: 2, z: 3 }, size: { w: 1, d: 1, h: 1 }, tone: 'neutral' };
  expect(depth(e)).toBe(6);
  expect(depth({ ...e, pos: { x: 1, y: 2 } })).toBe(3);
});
