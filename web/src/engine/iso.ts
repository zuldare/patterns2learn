import type { Entity, IsoPoint } from './types';

export const TILE_W = 64;
export const TILE_H = 32;

export type ScreenPoint = { sx: number; sy: number };

/** 2:1 isometric projection (spec §8.1): x → down-right, y → down-left, z → up. */
export function project(p: IsoPoint): ScreenPoint {
  const z = p.z ?? 0;
  // `+ 0` normalises -0 to 0 so callers can compare with toEqual / string output.
  return {
    sx: ((p.x - p.y) * TILE_W) / 2 + 0,
    sy: ((p.x + p.y) * TILE_H) / 2 - z * TILE_H + 0,
  };
}

/** Painter's order key: lower is drawn first. */
export function depth(e: Entity): number {
  return e.pos.x + e.pos.y + (e.pos.z ?? 0);
}

/** Projected centre of the entity's top face. */
export function topCenter(e: Entity): ScreenPoint {
  const { pos, size } = e;
  return project({ x: pos.x + size.w / 2, y: pos.y + size.d / 2, z: (pos.z ?? 0) + size.h });
}
