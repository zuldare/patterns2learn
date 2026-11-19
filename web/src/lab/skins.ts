/**
 * Figure lab (spike): two candidate visual skins for the isometric engine,
 * drawn on the same scene data as the real renderer so they can be compared
 * side by side at /lab/figuras/. Nothing here is used by the lessons yet.
 *
 *  - "taller": tech objects with personality (decals, LEDs, sockets, cartridges, voxel athlete).
 *  - "box":    the CrossFit box itself (reception desk, WOD board, rig, kettlebell, plates…).
 */
import { TILE_W, project as P, type ScreenPoint } from '../engine/iso';
import { escapeXml, itemState, pillMarkup } from '../engine/render';
import type { Entity, Link, Scene, SceneStep, Tone } from '../engine/types';

export type SkinId = 'taller' | 'box';
export type Role =
  | 'actor'
  | 'context'
  | 'controller'
  | 'service'
  | 'legacy'
  | 'interface'
  | 'monthly'
  | 'tenpack'
  | 'dropin'
  | 'student'
  | 'encoder';

const n = (v: number): string => String(Math.round(v * 100) / 100 + 0);
const pts = (a: ScreenPoint[]): string => a.map(p => `${n(p.sx)},${n(p.sy)}`).join(' ');

const F = {
  top: 'fill:var(--surface)',
  left: 'fill:color-mix(in srgb, var(--tone) 35%, var(--surface))',
  right: 'fill:color-mix(in srgb, var(--tone) 55%, var(--surface))',
  accentL: 'fill:color-mix(in srgb, var(--accent) 55%, var(--surface))',
  accentR: 'fill:color-mix(in srgb, var(--accent) 80%, var(--surface))',
  accentT: 'fill:color-mix(in srgb, var(--accent) 30%, var(--surface))',
  ink: 'fill:var(--ink)',
  none: 'fill:none',
};
const STROKE = 'stroke:var(--ink);stroke-width:1.5px;stroke-linejoin:round;stroke-linecap:round';
const THIN = 'stroke:var(--ink);stroke-width:1px;stroke-linejoin:round;stroke-linecap:round';
const NSS = 'vector-effect:non-scaling-stroke';

type Faces = { top?: string; left?: string; right?: string };

/** Axis-aligned box: left face = y+d side, right face = x+w side (same as render.ts). */
function prism(x: number, y: number, z: number, w: number, d: number, h: number, f: Faces = {}): string {
  const t = [P({ x, y, z: z + h }), P({ x: x + w, y, z: z + h }), P({ x: x + w, y: y + d, z: z + h }), P({ x, y: y + d, z: z + h })];
  const rb = P({ x: x + w, y, z });
  const fb = P({ x: x + w, y: y + d, z });
  const lb = P({ x, y: y + d, z });
  return (
    `<polygon class="iso-face" points="${pts([t[3], t[2], fb, lb])}" style="${f.left ?? F.left}"/>` +
    `<polygon class="iso-face" points="${pts([t[2], t[1], rb, fb])}" style="${f.right ?? F.right}"/>` +
    `<polygon class="iso-face" points="${pts(t)}" style="${f.top ?? F.top}"/>`
  );
}

/** Upright cylinder centred on (cx, cy). */
function cyl(cx: number, cy: number, z: number, r: number, h: number, side = F.right, top = F.top): string {
  const c = P({ x: cx, y: cy, z: z + h });
  const b = P({ x: cx, y: cy, z });
  const rx = r * Math.SQRT2 * (TILE_W / 2);
  const ry = rx / 2;
  const d =
    `M${n(c.sx - rx)},${n(c.sy)} L${n(b.sx - rx)},${n(b.sy)} ` +
    `A${n(rx)},${n(ry)} 0 0 0 ${n(b.sx + rx)},${n(b.sy)} L${n(c.sx + rx)},${n(c.sy)} Z`;
  return (
    `<path class="iso-face" d="${d}" style="${side}"/>` +
    `<ellipse class="iso-face" cx="${n(c.sx)}" cy="${n(c.sy)}" rx="${n(rx)}" ry="${n(ry)}" style="${top}"/>`
  );
}

function shadow(cx: number, cy: number, z: number, r: number): string {
  const c = P({ x: cx, y: cy, z });
  const rx = r * Math.SQRT2 * (TILE_W / 2);
  return `<ellipse cx="${n(c.sx)}" cy="${n(c.sy)}" rx="${n(rx)}" ry="${n(rx / 2)}" style="fill:var(--ink);opacity:.14"/>`;
}

/**
 * Affine matrix mapping the unit square onto one face of a box, so flat icons
 * ("decals") can be drawn in 0..1 coordinates and land in perspective.
 */
function faceMatrix(face: 'top' | 'left' | 'right', x: number, y: number, z: number, w: number, d: number, h: number): string {
  let o: ScreenPoint, u: ScreenPoint, v: ScreenPoint;
  if (face === 'top') {
    o = P({ x, y, z: z + h });
    u = P({ x: x + w, y, z: z + h });
    v = P({ x, y: y + d, z: z + h });
  } else if (face === 'left') {
    o = P({ x, y: y + d, z: z + h });
    u = P({ x: x + w, y: y + d, z: z + h });
    v = P({ x, y: y + d, z });
  } else {
    o = P({ x: x + w, y: y + d, z: z + h });
    u = P({ x: x + w, y, z: z + h });
    v = P({ x: x + w, y: y + d, z });
  }
  return `matrix(${n(u.sx - o.sx)} ${n(u.sy - o.sy)} ${n(v.sx - o.sx)} ${n(v.sy - o.sy)} ${n(o.sx)} ${n(o.sy)})`;
}

function decal(face: 'top' | 'left' | 'right', box: [number, number, number, number, number, number], body: string): string {
  return `<g transform="${faceMatrix(face, ...box)}">${body}</g>`;
}

/* ---------- Flat icons, drawn in the unit square (0..1) ---------- */

const s = (extra = ''): string => `style="${STROKE};${NSS};${extra}"`;
const ICON = {
  gear(): string {
    const teeth = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return `<line x1="${n(0.5 + Math.cos(a) * 0.22)}" y1="${n(0.5 + Math.sin(a) * 0.22)}" x2="${n(0.5 + Math.cos(a) * 0.34)}" y2="${n(0.5 + Math.sin(a) * 0.34)}" ${s('stroke-width:3px')}/>`;
    }).join('');
    return teeth + `<circle cx=".5" cy=".5" r=".22" ${s('fill:var(--surface)')}/><circle cx=".5" cy=".5" r=".08" ${s('fill:var(--ink)')}/>`;
  },
  arrowIn(): string {
    return `<path d="M.15 .5 H.62 M.48 .34 L.64 .5 L.48 .66" ${s('fill:none;stroke-width:2.5px')}/><path d="M.72 .2 V.8" ${s('stroke-width:2.5px')}/>`;
  },
  socket(slots: number): string {
    return Array.from({ length: slots }, (_, i) => {
      const cx = (i + 0.5) / slots;
      return `<rect x="${n(cx - 0.09)}" y=".3" width=".18" height=".4" rx=".04" ${s('fill:var(--ink);opacity:.75')}/>`;
    }).join('');
  },
  calendar(): string {
    return (
      `<rect x=".18" y=".22" width=".64" height=".6" rx=".06" ${s('fill:var(--surface)')}/>` +
      `<rect x=".18" y=".22" width=".64" height=".16" ${s('fill:var(--accent)')}/>` +
      `<text x=".5" y=".72" text-anchor="middle" style="font-size:.32px;font-weight:700;fill:var(--ink)">30</text>`
    );
  },
  ten(): string {
    return (
      `<rect x=".14" y=".26" width=".72" height=".48" rx=".08" ${s('fill:var(--surface)')}/>` +
      `<text x=".5" y=".62" text-anchor="middle" style="font-size:.34px;font-weight:700;fill:var(--ink)">×10</text>`
    );
  },
  ticket(): string {
    return (
      `<path d="M.15 .3 H.85 V.43 A.07 .07 0 0 0 .85 .57 V.7 H.15 V.57 A.07 .07 0 0 0 .15 .43 Z" ${s('fill:var(--surface)')}/>` +
      `<path d="M.62 .32 V.68" ${s('stroke-dasharray:.04 .04')}/>`
    );
  },
  cap(): string {
    return (
      `<path d="M.5 .2 L.9 .4 L.5 .6 L.1 .4 Z" ${s('fill:var(--ink)')}/>` +
      `<path d="M.28 .5 V.7 Q.5 .82 .72 .7 V.5" ${s('fill:var(--surface)')}/>` +
      `<path d="M.82 .44 V.72" ${s('stroke:var(--accent-strong);stroke-width:2.5px')}/>`
    );
  },
  key(): string {
    return `<circle cx=".32" cy=".5" r=".14" ${s('fill:var(--surface)')}/><path d="M.46 .5 H.86 M.74 .5 V.64 M.84 .5 V.6" ${s('fill:none;stroke-width:2.5px')}/>`;
  },
  warning(): string {
    return `<path d="M.5 .16 L.88 .82 H.12 Z" ${s('fill:var(--warn)')}/><path d="M.5 .38 V.6" ${s('stroke-width:3px')}/><circle cx=".5" cy=".7" r=".03" ${s('fill:var(--ink)')}/>`;
  },
  spaghetti(): string {
    return (
      `<path d="M.05 .3 C.3 .1 .25 .8 .5 .5 S.7 .1 .95 .45" ${s('fill:none;stroke:var(--danger)')}/>` +
      `<path d="M.05 .65 C.25 .95 .45 .2 .6 .7 S.85 .9 .95 .7" ${s('fill:none')}/>`
    );
  },
  leaf(): string {
    return `<path d="M.2 .8 C.2 .35 .5 .15 .85 .15 C.85 .55 .6 .8 .2 .8 Z" ${s('fill:var(--accent)')}/><path d="M.2 .8 L.6 .4" ${s('fill:none')}/>`;
  },
  leds(): string {
    return [0.2, 0.35, 0.5].map((x, i) => `<circle cx="${x}" cy=".3" r=".05" ${s(`fill:${i === 0 ? 'var(--accent)' : 'var(--surface)'}`)}/>`).join('');
  },
  lines(): string {
    return (
      `<text x=".08" y=".26" style="font-size:.2px;font-weight:700;fill:var(--ink)">WOD</text>` +
      [0.42, 0.56, 0.7].map((y, i) => `<path d="M.08 ${y} H${i === 1 ? 0.6 : 0.82}" ${s('stroke-width:1px')}/>`).join('') +
      `<text x=".92" y=".9" text-anchor="end" style="font-size:.18px;font-weight:700;fill:var(--accent-strong)">€</text>`
    );
  },
  tape(): string {
    const stripes = Array.from({ length: 6 }, (_, i) => `<path d="M${n(i * 0.2 - 0.1)} .58 L${n(i * 0.2 + 0.05)} .4" ${s('stroke:var(--ink);stroke-width:4px;stroke-linecap:butt')}/>`).join('');
    return `<rect x="0" y=".4" width="1" height=".18" style="fill:var(--warn)"/>${stripes}`;
  },
};

/* ---------- Figures. Each returns its markup and its height (iso z units) for the label. ---------- */

type Fig = { svg: string; h: number };
type Ctx = { cx: number; cy: number; z: number; e: Entity };

function voxelAthlete({ cx, cy, z }: Ctx, flex: boolean): Fig {
  const parts: string[] = [shadow(cx, cy, z, 0.42)];
  const top = F.accentT;
  // legs (back one first)
  parts.push(prism(cx - 0.17, cy - 0.06, z, 0.13, 0.13, 0.36));
  parts.push(prism(cx + 0.04, cy - 0.06, z, 0.13, 0.13, 0.36));
  if (flex) {
    // raised arms behind the torso
    parts.push(prism(cx - 0.36, cy - 0.05, z + 0.62, 0.1, 0.1, 0.42, { top, left: F.accentL, right: F.accentR }));
  } else {
    parts.push(prism(cx - 0.3, cy - 0.05, z + 0.34, 0.09, 0.1, 0.38, { top, left: F.accentL, right: F.accentR }));
  }
  parts.push(prism(cx - 0.21, cy - 0.1, z + 0.36, 0.42, 0.2, 0.42, { top, left: F.accentL, right: F.accentR }));
  if (flex) {
    parts.push(prism(cx + 0.26, cy - 0.05, z + 0.62, 0.1, 0.1, 0.42, { top, left: F.accentL, right: F.accentR }));
  } else {
    parts.push(prism(cx + 0.21, cy - 0.05, z + 0.34, 0.09, 0.1, 0.38, { top, left: F.accentL, right: F.accentR }));
  }
  const head = P({ x: cx, y: cy, z: z + 1.0 });
  parts.push(`<circle class="iso-face" cx="${n(head.sx)}" cy="${n(head.sy)}" r="9" style="fill:var(--surface)"/>`);
  if (flex) {
    parts.push(`<path d="M${n(head.sx - 8.6)},${n(head.sy - 2)} Q${n(head.sx)},${n(head.sy + 1)} ${n(head.sx + 8.6)},${n(head.sy - 2)}" style="${STROKE};stroke:var(--accent-strong);stroke-width:3.5px;fill:none"/>`);
  }
  parts.push(`<circle cx="${n(head.sx - 3)}" cy="${n(head.sy)}" r="1.3" style="fill:var(--ink)"/><circle cx="${n(head.sx + 3)}" cy="${n(head.sy)}" r="1.3" style="fill:var(--ink)"/>`);
  parts.push(`<path d="M${n(head.sx - 3)},${n(head.sy + 3.5)} Q${n(head.sx)},${n(head.sy + 6)} ${n(head.sx + 3)},${n(head.sy + 3.5)}" style="${THIN};fill:none"/>`);
  return { svg: parts.join(''), h: 1.25 };
}

/** Plain block with a top decal, LEDs on the right face and a softer lid. */
function techBlock({ cx, cy, z, e }: Ctx, icon: string, h = e.size.h, extraLeft = ''): Fig {
  const w = Math.min(e.size.w, 1) * 0.86;
  const d = Math.min(e.size.d, 1) * 0.86;
  const x = cx - w / 2;
  const y = cy - d / 2;
  const box: [number, number, number, number, number, number] = [x, y, z, w, d, h];
  return {
    svg:
      shadow(cx, cy, z, 0.6) +
      prism(x, y, z, w, d, h) +
      prism(x + 0.08, y + 0.08, z + h, w - 0.16, d - 0.16, 0.06) +
      decal('top', [x + 0.08, y + 0.08, z + h, w - 0.16, d - 0.16, 0.06], `<g transform="translate(.12 .12) scale(.76)">${icon}</g>`) +
      decal('right', box, ICON.leds()) +
      (extraLeft ? decal('left', box, extraLeft) : ''),
    h: h + 0.06,
  };
}

function cartridge({ cx, cy, z }: Ctx, icon: string): Fig {
  const w = 0.62;
  const d = 0.36;
  const h = 0.72;
  const x = cx - w / 2;
  const y = cy - d / 2;
  const box: [number, number, number, number, number, number] = [x, y, z, w, d, h];
  return {
    svg:
      shadow(cx, cy, z, 0.45) +
      prism(x, y, z, w, d, h) +
      // contacts strip at the bottom of the front face
      decal('left', box, `<rect x=".12" y=".72" width=".76" height=".14" ${s('fill:var(--accent-strong)')}/>` + `<g transform="translate(.2 .04) scale(.6)">${icon}</g>`),
    h,
  };
}

function socketBoard({ cx, cy, z, e }: Ctx): Fig {
  const w = e.size.w;
  const d = e.size.d * 0.7;
  const h = 0.32;
  const x = cx - w / 2;
  const y = cy - d / 2;
  return {
    svg:
      `<g style="stroke-dasharray:5 3">${prism(x, y, z, w, d, h)}</g>` +
      decal('top', [x, y, z, w, d, h], ICON.socket(4)) +
      decal('left', [x, y, z, w, d, h], `<text x=".5" y=".72" text-anchor="middle" style="font-size:.42px;font-weight:700;fill:var(--ink)">«i»</text>`),
    h,
  };
}

function platform({ e }: Ctx, tiles: boolean): Fig {
  const { x, y } = e.pos;
  const z = e.pos.z ?? 0;
  const { w, d, h } = e.size;
  const fills = { top: 'fill:color-mix(in srgb, var(--tone) 10%, var(--bg))' };
  let grid = '';
  for (let i = 1; i < w; i++) grid += `<line x1="${n(P({ x: x + i, y, z: z + h }).sx)}" y1="${n(P({ x: x + i, y, z: z + h }).sy)}" x2="${n(P({ x: x + i, y: y + d, z: z + h }).sx)}" y2="${n(P({ x: x + i, y: y + d, z: z + h }).sy)}" style="stroke:var(--line);stroke-width:1px"/>`;
  for (let j = 1; j < d; j++) grid += `<line x1="${n(P({ x, y: y + j, z: z + h }).sx)}" y1="${n(P({ x, y: y + j, z: z + h }).sy)}" x2="${n(P({ x: x + w, y: y + j, z: z + h }).sx)}" y2="${n(P({ x: x + w, y: y + j, z: z + h }).sy)}" style="stroke:var(--line);stroke-width:1px"/>`;
  let checker = '';
  if (tiles) {
    for (let i = 0; i < Math.floor(w); i++)
      for (let j = 0; j < Math.floor(d); j++)
        if ((i + j) % 2 === 0)
          checker += `<polygon points="${pts([P({ x: x + i, y: y + j, z: z + h }), P({ x: x + i + 1, y: y + j, z: z + h }), P({ x: x + i + 1, y: y + j + 1, z: z + h }), P({ x: x + i, y: y + j + 1, z: z + h })])}" style="fill:var(--ink);opacity:.06"/>`;
  }
  const badgeBox: [number, number, number, number, number, number] = [x + w - 1.3, y + d - 1.3, z, 1, 1, h];
  const badge = tiles ? '' : decal('top', badgeBox, ICON.leaf());
  return { svg: prism(x, y, z, w, d, h, fills) + checker + grid + badge, h };
}

/* --- "box" props --- */

function receptionDesk({ cx, cy, z }: Ctx): Fig {
  const w = 0.95;
  const x = cx - w / 2;
  const y = cy - 0.4;
  const bell = P({ x: cx + 0.15, y: y + 0.65, z: z + 0.48 });
  return {
    svg:
      shadow(cx, cy, z, 0.62) +
      prism(x, y, z, w, 0.14, 1.0) +
      decal('left', [x, y, z, w, 0.14, 1.0], `<text x=".5" y=".28" text-anchor="middle" style="font-size:.24px;font-weight:700;fill:var(--ink)">INFO</text>`) +
      prism(x, y + 0.42, z, w, 0.38, 0.48, { top: F.top }) +
      decal('left', [x, y + 0.42, z, w, 0.38, 0.48], `<rect x=".08" y=".2" width=".84" height=".12" style="fill:var(--accent)"/>`) +
      `<path class="iso-face" d="M${n(bell.sx - 6)},${n(bell.sy)} Q${n(bell.sx)},${n(bell.sy - 11)} ${n(bell.sx + 6)},${n(bell.sy)} Z" style="fill:var(--warn)"/>` +
      `<circle cx="${n(bell.sx)}" cy="${n(bell.sy - 8.5)}" r="1.6" style="fill:var(--ink)"/>`,
    h: 1.0,
  };
}

function wodBoard({ cx, cy, z, e }: Ctx, broken = false): Fig {
  const w = 1.0;
  const x = cx - w / 2;
  const y = cy - 0.05;
  const legs = prism(x + 0.08, y - 0.18, z, 0.06, 0.4, 0.06) + prism(x + w - 0.14, y - 0.18, z, 0.06, 0.4, 0.06);
  const posts = prism(x + 0.08, y, z, 0.06, 0.06, 0.4) + prism(x + w - 0.14, y, z, 0.06, 0.06, 0.4);
  const board: [number, number, number, number, number, number] = [x, y, z + 0.35, w, 0.07, 0.72];
  const face = broken ? `<g transform="translate(.05 .1) scale(.9)">${ICON.spaghetti()}</g>` + ICON.tape() : ICON.lines();
  const cone = broken ? coneProp(cx + 0.55, cy + 0.45, z) : '';
  return {
    svg: shadow(cx, cy, z, 0.62) + legs + posts + prism(...board, { left: 'fill:var(--surface)', top: F.top }) + decal('left', board, face) + cone,
    h: 1.07 + (e.size.h > 0.6 ? 0 : 0),
  };
}

function coneProp(cx: number, cy: number, z: number): string {
  const b = P({ x: cx, y: cy, z });
  const tip = P({ x: cx, y: cy, z: z + 0.6 });
  return (
    prism(cx - 0.18, cy - 0.18, z, 0.36, 0.36, 0.05, { top: 'fill:var(--warn)', left: 'fill:var(--warn)', right: 'fill:var(--warn)' }) +
    `<path class="iso-face" d="M${n(b.sx - 9)},${n(b.sy - 2)} L${n(tip.sx)},${n(tip.sy)} L${n(b.sx + 9)},${n(b.sy - 2)} Z" style="fill:var(--warn)"/>` +
    `<path d="M${n(b.sx - 6)},${n(b.sy - 8)} L${n(b.sx + 6)},${n(b.sy - 8)}" style="stroke:var(--surface);stroke-width:3px"/>`
  );
}

function rig({ cx, cy, z, e }: Ctx): Fig {
  const w = e.size.w;
  const x = cx - w / 2;
  const y = cy - 0.15;
  const H = 1.25;
  const metal = { top: 'fill:var(--muted)', left: 'fill:var(--muted)', right: 'fill:color-mix(in srgb, var(--muted) 70%, var(--ink))' };
  const hooks = [0.25, 0.5, 0.75]
    .map(f => {
      const a = P({ x: x + w * f, y: y + 0.05, z: z + H });
      return `<path d="M${n(a.sx)},${n(a.sy)} v12 q0,5 5,4" style="${STROKE};fill:none"/>`;
    })
    .join('');
  return {
    svg:
      `<g style="stroke-dasharray:5 3">${prism(x - 0.1, y - 0.3, z, w + 0.2, 0.7, 0.05, { top: 'fill:color-mix(in srgb, var(--surface) 60%, transparent)' })}</g>` +
      prism(x, y, z, 0.1, 0.1, H, metal) +
      prism(x + 0.1, y, z + H - 0.1, w - 0.2, 0.1, 0.1, metal) +
      hooks +
      prism(x + w - 0.1, y, z, 0.1, 0.1, H, metal) +
      decal('left', [x + 0.1, y, z + H - 0.1, w - 0.2, 0.1, 0.1], `<text x=".5" y=".95" text-anchor="middle" style="font-size:.9px;font-weight:700;fill:var(--surface)">«interface»</text>`),
    h: H,
  };
}

function kettlebell({ cx, cy, z }: Ctx): Fig {
  const c = P({ x: cx, y: cy, z: z + 0.32 });
  const r = 15;
  return {
    svg:
      shadow(cx, cy, z, 0.42) +
      `<path d="M${n(c.sx - 9)},${n(c.sy - 10)} C${n(c.sx - 11)},${n(c.sy - 30)} ${n(c.sx + 11)},${n(c.sy - 30)} ${n(c.sx + 9)},${n(c.sy - 10)}" style="${STROKE};stroke-width:5px;fill:none"/>` +
      `<path d="M${n(c.sx - 9)},${n(c.sy - 10)} C${n(c.sx - 11)},${n(c.sy - 30)} ${n(c.sx + 11)},${n(c.sy - 30)} ${n(c.sx + 9)},${n(c.sy - 10)}" style="stroke:var(--surface);stroke-width:2px;fill:none"/>` +
      `<circle class="iso-face" cx="${n(c.sx)}" cy="${n(c.sy)}" r="${r}" style="${F.right}"/>` +
      `<path d="M${n(c.sx - r)},${n(c.sy)} A${r},${r} 0 0 1 ${n(c.sx)},${n(c.sy - r)} A${r},${r} 0 0 0 ${n(c.sx - r * 0.3)},${n(c.sy + r * 0.6)} Z" style="fill:var(--surface);opacity:.45"/>` +
      `<text x="${n(c.sx)}" y="${n(c.sy + 4)}" text-anchor="middle" style="font-size:9px;font-weight:700;fill:var(--ink)">30d</text>`,
    h: 1.15,
  };
}

function plates({ cx, cy, z }: Ctx): Fig {
  let svg = shadow(cx, cy, z, 0.45);
  const tones = [F.right, F.accentR, F.right, F.accentR];
  for (let i = 0; i < 4; i++) svg += cyl(cx, cy, z + i * 0.1, 0.38, 0.1, tones[i], i === 3 ? F.top : tones[i]);
  const top = P({ x: cx, y: cy, z: z + 0.4 });
  svg += `<ellipse cx="${n(top.sx)}" cy="${n(top.sy)}" rx="5" ry="2.5" style="fill:var(--ink)"/>`;
  svg += `<text x="${n(top.sx + 20)}" y="${n(top.sy - 8)}" style="font-size:9px;font-weight:700;fill:var(--ink)">×10</text>`;
  return { svg, h: 0.45 };
}

function plyoBox({ cx, cy, z }: Ctx): Fig {
  const w = 0.7;
  const x = cx - w / 2;
  const y = cy - w / 2;
  const box: [number, number, number, number, number, number] = [x, y, z, w, w * 0.8, 0.55];
  return {
    svg:
      shadow(cx, cy, z, 0.5) +
      prism(...box, { top: F.top, left: 'fill:color-mix(in srgb, var(--warn) 40%, var(--surface))', right: 'fill:color-mix(in srgb, var(--warn) 60%, var(--surface))' }) +
      decal('left', box, `<text x=".5" y=".72" text-anchor="middle" style="font-size:.55px;font-weight:700;fill:var(--ink)">1</text>`) +
      decal('right', box, `<circle cx=".5" cy=".42" r=".14" style="fill:var(--ink);opacity:.5"/>`),
    h: 0.55,
  };
}

function medBall({ cx, cy, z }: Ctx): Fig {
  const c = P({ x: cx, y: cy, z: z + 0.3 });
  const r = 15;
  const capY = c.sy - r - 1;
  return {
    svg:
      shadow(cx, cy, z, 0.42) +
      `<circle class="iso-face" cx="${n(c.sx)}" cy="${n(c.sy)}" r="${r}" style="${F.accentR}"/>` +
      `<path d="M${n(c.sx - r)},${n(c.sy)} Q${n(c.sx)},${n(c.sy + 9)} ${n(c.sx + r)},${n(c.sy)} M${n(c.sx)},${n(c.sy - r)} Q${n(c.sx - 8)},${n(c.sy)} ${n(c.sx)},${n(c.sy + r)}" style="${THIN};fill:none"/>` +
      `<path class="iso-face" d="M${n(c.sx)},${n(capY - 8)} L${n(c.sx + 14)},${n(capY - 3)} L${n(c.sx)},${n(capY + 2)} L${n(c.sx - 14)},${n(capY - 3)} Z" style="fill:var(--ink)"/>` +
      `<path d="M${n(c.sx + 11)},${n(capY - 3)} v9" style="stroke:var(--warn);stroke-width:2px"/>`,
    h: 1.0,
  };
}

function lockerKey({ cx, cy, z, e }: Ctx): Fig {
  // Encoder: a locker bank with a key decal.
  const w = 0.9;
  const x = cx - w / 2;
  const y = cy - 0.25;
  const box: [number, number, number, number, number, number] = [x, y, z, w, 0.5, 1.0];
  const doors = [0, 1, 2]
    .map(i => `<rect x="${n(0.06 + i * 0.31)}" y=".06" width=".26" height=".88" ${s('fill:var(--surface)')}/><path d="M${n(0.11 + i * 0.31)} .2 H${n(0.27 + i * 0.31)} M${n(0.11 + i * 0.31)} .26 H${n(0.27 + i * 0.31)}" ${s('stroke-width:1px')}/>`)
    .join('');
  void e;
  return { svg: shadow(cx, cy, z, 0.6) + prism(...box) + decal('left', box, doors) + decal('top', box, `<g transform="translate(.15 .1) scale(.7)">${ICON.key()}</g>`), h: 1.0 };
}

const SKINS: Record<SkinId, (role: Role, c: Ctx) => Fig> = {
  taller(role, c) {
    switch (role) {
      case 'actor': return voxelAthlete(c, false);
      case 'context': return platform(c, false);
      case 'controller': return techBlock(c, ICON.arrowIn());
      case 'service': return techBlock(c, ICON.gear());
      case 'legacy': return techBlock(c, ICON.warning(), c.e.size.h, ICON.spaghetti());
      case 'interface': return socketBoard(c);
      case 'monthly': return cartridge(c, ICON.calendar());
      case 'tenpack': return cartridge(c, ICON.ten());
      case 'dropin': return cartridge(c, ICON.ticket());
      case 'student': return cartridge(c, ICON.cap());
      case 'encoder': return techBlock(c, ICON.key());
    }
  },
  box(role, c) {
    switch (role) {
      case 'actor': return voxelAthlete(c, true);
      case 'context': return platform(c, true);
      case 'controller': return receptionDesk(c);
      case 'service': return wodBoard(c);
      case 'legacy': return wodBoard(c, true);
      case 'interface': return rig(c);
      case 'monthly': return kettlebell(c);
      case 'tenpack': return plates(c);
      case 'dropin': return plyoBox(c);
      case 'student': return medBall(c);
      case 'encoder': return lockerKey(c);
    }
  },
};

/** Strategy scene ids → roles. */
export const ROLE_BY_ID: Record<string, Role> = {
  athlete: 'actor',
  context: 'context',
  controller: 'controller',
  service: 'service',
  legacy: 'legacy',
  iface: 'interface',
  monthly: 'monthly',
  tenpack: 'tenpack',
  dropin: 'dropin',
  student: 'student',
  encoder: 'encoder',
};

function ctxOf(e: Entity): Ctx {
  return { cx: e.pos.x + e.size.w / 2, cy: e.pos.y + e.size.d / 2, z: e.pos.z ?? 0, e };
}

function figure(skin: SkinId, e: Entity, step?: Pick<SceneStep, 'visible' | 'highlight'>): { svg: string; anchor: ScreenPoint } {
  const role = ROLE_BY_ID[e.id] ?? 'service';
  const c = ctxOf(e);
  const fig = SKINS[skin](role, c);
  let anchor: ScreenPoint;
  if (role === 'context') {
    const edge = P({ x: e.pos.x + e.size.w / 2, y: e.pos.y + e.size.d, z: c.z });
    anchor = { sx: edge.sx, sy: edge.sy + 26 };
  } else {
    const top = P({ x: c.cx, y: c.cy, z: c.z + fig.h });
    anchor = { sx: top.sx, sy: top.sy - 30 };
  }
  const st = step ? itemState(step, e) : { hidden: false, highlighted: false };
  const cls = `iso-entity kind-${e.kind} tone-${e.tone}${st.hidden ? ' is-hidden' : ''}${st.highlighted ? ' is-highlighted' : ''}`;
  const fill = e.kind === 'container' ? 'var(--bg)' : 'var(--surface)';
  return {
    svg:
      `<g class="${cls}" data-id="${escapeXml(e.id)}">` +
      fig.svg +
      `<g class="iso-label" transform="translate(${n(anchor.sx)} ${n(anchor.sy)})">${pillMarkup(e.label, 'iso-label', fill)}</g>` +
      `</g>`,
    anchor,
  };
}

const MARKERS = (id: string): string =>
  '<defs>' +
  `<marker id="${id}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--ink);fill:context-stroke"/></marker>` +
  `<marker id="${id}-tri" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,1 L13,7 L1,13 Z" style="fill:var(--surface);stroke:var(--ink);stroke:context-stroke;stroke-width:1.5;stroke-linejoin:round"/></marker>` +
  `<marker id="${id}-dia" viewBox="0 0 14 10" refX="13" refY="5" markerWidth="14" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,5 L7,1 L13,5 L7,9 Z" style="fill:var(--ink);fill:context-stroke"/></marker>` +
  '</defs>';

/** Whole scene in a lab skin, same entity positions/links as the real one. */
export function renderSkinScene(skin: SkinId, scene: Scene, step: SceneStep, label: string): string {
  const byId = new Map(scene.entities.map(e => [e.id, e]));
  const ordered = [...scene.entities].sort((a, b) => a.pos.x + a.pos.y + (a.pos.z ?? 0) - (b.pos.x + b.pos.y + (b.pos.z ?? 0)));
  const figs = ordered.map(e => figure(skin, e, step));
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const e of scene.entities) {
    for (const [dx, dy] of [[0, 0], [e.size.w, 0], [0, e.size.d], [e.size.w, e.size.d]]) {
      const p = P({ x: e.pos.x + dx, y: e.pos.y + dy, z: 0 });
      box.minX = Math.min(box.minX, p.sx - 70);
      box.maxX = Math.max(box.maxX, p.sx + 70);
      box.maxY = Math.max(box.maxY, p.sy + 50);
      box.minY = Math.min(box.minY, p.sy - (e.kind === 'container' ? 20 : 95));
    }
  }
  const markerOf: Record<Link['style'], string> = { call: 'arrow', implements: 'tri', injects: 'dia' };
  const links = scene.links
    .map(l => {
      const a = byId.get(l.from)!;
      const b = byId.get(l.to)!;
      const ca = ctxOf(a);
      const cb = ctxOf(b);
      const p1 = P({ x: ca.cx, y: ca.cy, z: ca.z + 0.5 });
      const p2 = P({ x: cb.cx, y: cb.cy, z: cb.z + 0.5 });
      const len = Math.hypot(p2.sx - p1.sx, p2.sy - p1.sy) || 1;
      const k1 = Math.min(0.4, 34 / len);
      const k2 = Math.min(0.4, 40 / len);
      const q1 = { sx: p1.sx + (p2.sx - p1.sx) * k1, sy: p1.sy + (p2.sy - p1.sy) * k1 };
      const q2 = { sx: p2.sx - (p2.sx - p1.sx) * k2, sy: p2.sy - (p2.sy - p1.sy) * k2 };
      const st = itemState(step, l);
      return (
        `<g class="iso-link style-${l.style}${st.hidden ? ' is-hidden' : ''}${st.highlighted ? ' is-highlighted' : ''}" data-id="${escapeXml(l.id)}" data-from="${escapeXml(l.from)}" data-to="${escapeXml(l.to)}">` +
        `<path class="iso-link-line" d="M${n(q1.sx)},${n(q1.sy)} L${n(q2.sx)},${n(q2.sy)}" marker-end="url(#${skin}-${markerOf[l.style]})"/></g>`
      );
    })
    .join('');
  const vb = [box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="iso-scene" role="img" aria-label="${escapeXml(label)}" viewBox="${vb.map(n).join(' ')}">` +
    MARKERS(skin) +
    `<g class="iso-entities">${figs.map(f => f.svg).join('')}</g>` +
    `<g class="iso-links">${links}</g>` +
    `</svg>`
  );
}

/** One figure alone, centred in its own small viewBox. */
export function renderSkinFigure(skin: SkinId, e: Entity, label: string): string {
  const role = ROLE_BY_ID[e.id];
  const isCtx = role === 'context';
  const { svg } = figure(skin, e);
  const c = P({ x: e.pos.x + e.size.w / 2, y: e.pos.y + e.size.d / 2, z: 0 });
  const vb = isCtx ? [c.sx - 140, c.sy - 110, 280, 200] : [c.sx - 90, c.sy - 120, 180, 160];
  return `<svg xmlns="http://www.w3.org/2000/svg" class="iso-scene" role="img" aria-label="${escapeXml(label)}" viewBox="${vb.map(n).join(' ')}">${svg}</svg>`;
}

/** Entities for the per-figure grid: standalone copies of the scene ones. */
export function galleryEntity(id: string, label: string, kind: Entity['kind'], tone: Tone): Entity {
  if (id === 'context') return { id, kind, label, pos: { x: 0, y: 0 }, size: { w: 4, d: 3, h: 0.25 }, tone };
  if (id === 'iface') return { id, kind, label, pos: { x: 0, y: 0 }, size: { w: 1.4, d: 1.4, h: 0.6 }, tone };
  if (id === 'athlete') return { id, kind, label, pos: { x: 0, y: 0 }, size: { w: 1.2, d: 1.2, h: 0.5 }, tone };
  const small = ['monthly', 'tenpack', 'dropin', 'student'].includes(id);
  return { id, kind, label, pos: { x: 0, y: 0 }, size: { w: 1, d: 1, h: small ? 0.45 : 0.6 }, tone };
}
