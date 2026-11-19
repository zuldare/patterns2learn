import { decal, iconMarkup, n, st, type Box3 } from './icons';
import { TILE_W, project, type ScreenPoint } from './iso';
import type { Entity, Link } from './types';

/**
 * "Taller" figures (ADR 0001): the shape of an entity is derived from its
 * kind and from the scene's `implements` links; lessons only pick an icon.
 * Every shaded surface carries `iso-face` so engine.css can outline,
 * dash and highlight it; every colour is a token.
 */

export type FigureShape = 'voxel' | 'platform' | 'socket' | 'cartridge' | 'block';
export type FigureCtx = { slots: number; isImplementation: boolean };

export function figureCtx(e: Entity, links: Link[]): FigureCtx {
  const impl = links.filter(l => l.style === 'implements');
  return { slots: impl.filter(l => l.to === e.id).length, isImplementation: impl.some(l => l.from === e.id) };
}

export function figureShape(e: Entity, ctx: FigureCtx): FigureShape {
  switch (e.kind) {
    case 'actor': return 'voxel';
    case 'container': return 'platform';
    case 'interface': return 'socket';
    default: return ctx.isImplementation ? 'cartridge' : 'block';
  }
}

/** Box of size w×d×h centred on the entity footprint, standing on its z. */
function centred(e: Entity, w: number, d: number, h: number): Box3 {
  return { x: e.pos.x + (e.size.w - w) / 2, y: e.pos.y + (e.size.d - d) / 2, z: e.pos.z ?? 0, w, d, h };
}

/** The solid the figure occupies, in iso units. */
export function figureBox(e: Entity, ctx: FigureCtx): Box3 {
  const { w, d, h } = e.size;
  const big = Math.max(w, d);
  switch (figureShape(e, ctx)) {
    case 'cartridge': return centred(e, 0.7 * w, 0.45 * d, 0.8 * big);
    case 'socket': return centred(e, w, 0.7 * d, Math.min(h, 0.35));
    case 'voxel': return centred(e, 0.5 * w, 0.3 * d, 1.25 * big);
    default: return centred(e, w, d, h);
  }
}

/* ---------- drawing helpers ---------- */

const pts = (a: ScreenPoint[]): string => a.map(p => `${n(p.sx)},${n(p.sy)}`).join(' ');
type Faces = { top?: string; left?: string; right?: string };
const TONE = {
  top: 'fill:var(--surface)',
  left: 'fill:color-mix(in srgb, var(--tone) 35%, var(--surface))',
  right: 'fill:color-mix(in srgb, var(--tone) 55%, var(--surface))',
};
const ACCENT: Faces = {
  top: 'fill:color-mix(in srgb, var(--accent) 30%, var(--surface))',
  left: 'fill:color-mix(in srgb, var(--accent) 55%, var(--surface))',
  right: 'fill:color-mix(in srgb, var(--accent) 80%, var(--surface))',
};

/** Axis-aligned box: left face = y+d side, right face = x+w side. */
function prism(b: Box3, f: Faces = {}, cls = ''): string {
  const { x, y, z, w, d, h } = b;
  const top = z + h;
  const t = [project({ x, y, z: top }), project({ x: x + w, y, z: top }), project({ x: x + w, y: y + d, z: top }), project({ x, y: y + d, z: top })];
  const rb = project({ x: x + w, y, z });
  const fb = project({ x: x + w, y: y + d, z });
  const lb = project({ x, y: y + d, z });
  const c = `iso-face${cls ? ` ${cls}` : ''}`;
  return (
    `<polygon class="${c} face-left" points="${pts([t[3], t[2], fb, lb])}" style="${f.left ?? TONE.left}"/>` +
    `<polygon class="${c} face-right" points="${pts([t[2], t[1], rb, fb])}" style="${f.right ?? TONE.right}"/>` +
    `<polygon class="${c} face-top" points="${pts(t)}" style="${f.top ?? TONE.top}"/>`
  );
}

function shadow(b: Box3, scale = 0.62): string {
  const c = project({ x: b.x + b.w / 2, y: b.y + b.d / 2, z: b.z });
  const rx = Math.max(b.w, b.d) * scale * Math.SQRT2 * (TILE_W / 2);
  return `<ellipse class="fig-shadow" cx="${n(c.sx)}" cy="${n(c.sy)}" rx="${n(rx)}" ry="${n(rx / 2)}" style="fill:var(--ink);opacity:.14"/>`;
}

const LEDS = [0.2, 0.35, 0.5]
  .map((x, i) => `<circle cx="${x}" cy=".3" r=".05" ${st(`fill:${i === 0 ? 'var(--accent)' : 'var(--surface)'}`)}/>`)
  .join('');
const CABLES =
  `<path d="M.05 .3 C.3 .1 .25 .8 .5 .5 S.7 .1 .95 .45" ${st('fill:none;stroke:var(--danger)')}/>` +
  `<path d="M.05 .65 C.25 .95 .45 .2 .6 .7 S.85 .9 .95 .7" ${st('fill:none')}/>`;

/* ---------- figures ---------- */

function block(e: Entity, b: Box3): string {
  const lid: Box3 = { x: b.x + 0.08, y: b.y + 0.08, z: b.z + b.h, w: b.w - 0.16, d: b.d - 0.16, h: 0.06 };
  return (
    shadow(b) +
    prism(b) +
    prism(lid, {}, 'fig-lid') +
    (e.icon ? decal('top', lid, `<g transform="translate(.12 .12) scale(.76)">${iconMarkup(e.icon)}</g>`, 'fig-icon') : '') +
    decal('right', b, LEDS, 'fig-leds') +
    (e.tone === 'danger' ? decal('left', b, CABLES, 'fig-cables') : '')
  );
}

function cartridge(e: Entity, b: Box3): string {
  return (
    shadow(b, 0.7) +
    prism(b) +
    decal('left', b, `<rect x=".12" y=".78" width=".76" height=".12" ${st('fill:var(--accent-strong)')}/>`, 'fig-contacts') +
    (e.icon ? decal('left', b, `<g transform="translate(.18 .08) scale(.64)">${iconMarkup(e.icon)}</g>`, 'fig-icon') : '')
  );
}

function socket(b: Box3, slots: number): string {
  const holes = Array.from({ length: slots }, (_, i) => {
    const cx = (i + 0.5) / slots;
    const w = Math.min(0.18, 0.6 / slots);
    return `<rect class="fig-slot" x="${n(cx - w / 2)}" y=".3" width="${n(w)}" height=".4" rx=".04" ${st('fill:var(--ink);opacity:.75')}/>`;
  }).join('');
  return (
    prism(b) +
    (slots > 0 ? decal('top', b, holes, 'fig-slots') : '') +
    decal('left', b, `<text x=".5" y=".75" text-anchor="middle" style="font-size:.5px;font-weight:700;fill:var(--ink)">«i»</text>`)
  );
}

function voxel(b: Box3): string {
  const { x, y, z, w, d, h } = b;
  const legH = 0.3 * h;
  const bodyH = 0.34 * h;
  const head = project({ x: x + w / 2, y: y + d / 2, z: z + h });
  const r = Math.max(7, h * 6.5);
  const cy = head.sy + r; // head top touches the box top
  return (
    shadow(b, 1.1) +
    prism({ x: x + 0.2 * w, y: y + 0.2 * d, z, w: 0.22 * w, d: 0.6 * d, h: legH }) +
    prism({ x: x + 0.58 * w, y: y + 0.2 * d, z, w: 0.22 * w, d: 0.6 * d, h: legH }) +
    prism({ x, y: y + 0.25 * d, z: z + legH, w: 0.15 * w, d: 0.5 * d, h: bodyH * 0.9 }, ACCENT) +
    prism({ x: x + 0.15 * w, y, z: z + legH, w: 0.7 * w, d, h: bodyH }, ACCENT) +
    prism({ x: x + 0.85 * w, y: y + 0.25 * d, z: z + legH, w: 0.15 * w, d: 0.5 * d, h: bodyH * 0.9 }, ACCENT) +
    `<circle class="iso-face fig-head" cx="${n(head.sx)}" cy="${n(cy)}" r="${n(r)}" style="fill:var(--surface)"/>` +
    `<circle cx="${n(head.sx - r / 3)}" cy="${n(cy)}" r="${n(r / 7)}" style="fill:var(--ink)"/>` +
    `<circle cx="${n(head.sx + r / 3)}" cy="${n(cy)}" r="${n(r / 7)}" style="fill:var(--ink)"/>` +
    `<path d="M${n(head.sx - r / 3)},${n(cy + r * 0.38)} Q${n(head.sx)},${n(cy + r * 0.65)} ${n(head.sx + r / 3)},${n(cy + r * 0.38)}" style="stroke:var(--ink);stroke-width:1px;stroke-linecap:round;fill:none"/>`
  );
}

function platform(b: Box3): string {
  const { x, y, z, w, d, h } = b;
  const top = z + h;
  const line = (a: ScreenPoint, c: ScreenPoint) =>
    `<line x1="${n(a.sx)}" y1="${n(a.sy)}" x2="${n(c.sx)}" y2="${n(c.sy)}" style="stroke:var(--line);stroke-width:1px"/>`;
  let grid = '';
  for (let i = 1; i < w; i++) grid += line(project({ x: x + i, y, z: top }), project({ x: x + i, y: y + d, z: top }));
  for (let j = 1; j < d; j++) grid += line(project({ x, y: y + j, z: top }), project({ x: x + w, y: y + j, z: top }));
  const s = Math.min(1, w / 3, d / 3);
  const badge: Box3 = { x: x + w - s - 0.3 * s, y: y + d - s - 0.3 * s, z, w: s, d: s, h };
  return (
    prism(b, { top: 'fill:color-mix(in srgb, var(--tone) 10%, var(--bg))' }) +
    `<g class="fig-grid">${grid}</g>` +
    decal('top', badge, iconMarkup('leaf'), 'fig-badge')
  );
}

export function figureMarkup(e: Entity, ctx: FigureCtx): string {
  const shape = figureShape(e, ctx);
  const b = figureBox(e, ctx);
  const body =
    shape === 'voxel' ? voxel(b)
    : shape === 'platform' ? platform(b)
    : shape === 'socket' ? socket(b, ctx.slots)
    : shape === 'cartridge' ? cartridge(e, b)
    : block(e, b);
  return `<g class="iso-figure figure-${shape}">${body}</g>`;
}
