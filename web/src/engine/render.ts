import { figureBox, figureCtx, figureMarkup, type FigureCtx } from './figures';
import type { Box3 } from './icons';
import { depth, project, type ScreenPoint } from './iso';
import type { Entity, Link, Scene, SceneStep } from './types';

/**
 * Pure SVG string renderer for an isometric scene (spec §8.2).
 *
 * Painting rules: every colour is a `var(--…)` token. Entity shapes come from
 * figures.ts (ADR 0001); fills that depend on the entity tone are written
 * inline (`--tone` is set per `.tone-*` class in engine.css); outlines, dashes
 * and state (`is-hidden`, `is-highlighted`) live in engine.css so the player
 * only toggles classes.
 */

export const MARGIN = 32;
const LABEL_FONT = 11;
const CHAR_W = LABEL_FONT * 0.62; // monospace advance
const LINK_GAP = 6; // px between a link end and the entity rim

const n = (v: number): string => String(Math.round(v * 100) / 100 + 0);
const pt = (p: ScreenPoint): string => `${n(p.sx)},${n(p.sy)}`;

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type StepState = Pick<SceneStep, 'visible' | 'highlight'>;

/**
 * Visibility and highlight of one scene item at a step: an entity is shown when
 * listed in `visible`; a link when both its ends are. Shared by the static
 * render and the runtime player so both always agree.
 */
export function itemState(
  step: StepState,
  item: { id: string; from?: string; to?: string },
): { hidden: boolean; highlighted: boolean } {
  const shown =
    item.from !== undefined || item.to !== undefined
      ? step.visible.includes(item.from ?? '') && step.visible.includes(item.to ?? '')
      : step.visible.includes(item.id);
  return { hidden: !shown, highlighted: step.highlight.includes(item.id) };
}

/** ` is-hidden is-highlighted` (as applicable) for the static markup. */
function stateClasses(step: StepState | undefined, item: { id: string; from?: string; to?: string }): string {
  if (!step) return '';
  const { hidden, highlighted } = itemState(step, item);
  return (hidden ? ' is-hidden' : '') + (highlighted ? ' is-highlighted' : '');
}

/** Width of a label pill for `text`. */
export function pillWidth(text: string): number {
  return Math.ceil(text.length * CHAR_W + 18);
}

export const PILL_H = 20;

/** Packets are a size smaller than labels so a message never reads as another component. */
export const PACKET_FONT = 9.5;
export const PACKET_H = 16;

/** Width of a packet pill for `text` (keep in sync with `.iso-packet text` in engine.css). */
export function packetWidth(text: string): number {
  return Math.ceil(text.length * PACKET_FONT * 0.62 + 14);
}

/** Pill markup centred on (0, cy); `cls` prefixes the rect/text classes. */
export function pillMarkup(text: string, cls: string, fill: string, cy = 0): string {
  const w = pillWidth(text);
  return (
    `<rect class="${cls}-pill" x="${n(-w / 2)}" y="${n(cy - PILL_H / 2)}" width="${w}" height="${PILL_H}" rx="${PILL_H / 2}" style="fill:${fill}"/>` +
    `<text class="${cls}-text" x="0" y="${n(cy)}" dy="0.35em" text-anchor="middle" style="fill:var(--ink)">${escapeXml(text)}</text>`
  );
}

export type Box = { minX: number; minY: number; maxX: number; maxY: number };
export type ViewBox = [number, number, number, number];

/** The canvas is never wider than this times its height. */
export const MAX_ASPECT = 2;

/** A step never zooms in further than this share of the whole scene's width, so a lone block doesn't fill the canvas. */
export const MIN_ZOOM = 0.55;

/**
 * The viewBox that frames a step: the union of its visible entities plus the margin, grown to the whole
 * scene's aspect ratio (so the canvas keeps its height from step to step) and to at least MIN_ZOOM of its
 * width. Shared by the static render and the player so both frame a step the same way.
 */
export function fitViewBox(visible: Box[], full: ViewBox): ViewBox {
  if (visible.length === 0) return full;
  const u: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const b of visible) {
    grow(u, { sx: b.minX, sy: b.minY });
    grow(u, { sx: b.maxX, sy: b.maxY });
  }
  const aspect = full[2] / full[3];
  let w = Math.max(u.maxX - u.minX + 2 * MARGIN, full[2] * MIN_ZOOM);
  let h = u.maxY - u.minY + 2 * MARGIN;
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;
  if (w >= full[2] || h >= full[3]) return full;
  const cx = (u.minX + u.maxX) / 2;
  const cy = (u.minY + u.maxY) / 2;
  return [cx - w / 2, cy - h / 2, w, h];
}

/** Parses a `data-bbox` attribute ("minX minY maxX maxY"). */
export function parseBox(attr: string | undefined): Box | null {
  const v = (attr ?? '').split(' ').map(Number);
  return v.length === 4 && v.every(Number.isFinite) ? { minX: v[0], minY: v[1], maxX: v[2], maxY: v[3] } : null;
}

function grow(box: Box, p: ScreenPoint): void {
  box.minX = Math.min(box.minX, p.sx);
  box.minY = Math.min(box.minY, p.sy);
  box.maxX = Math.max(box.maxX, p.sx);
  box.maxY = Math.max(box.maxY, p.sy);
}

function growPill(box: Box, c: ScreenPoint, text: string): void {
  const w = pillWidth(text);
  grow(box, { sx: c.sx - w / 2, sy: c.sy - PILL_H / 2 });
  grow(box, { sx: c.sx + w / 2, sy: c.sy + PILL_H / 2 });
}

/** The 4 projected corners of a box's top face, in order back, right, front, left. */
function topFace(b: Box3): ScreenPoint[] {
  const { x, y, w, d } = b;
  const top = b.z + b.h;
  return [
    project({ x, y, z: top }),
    project({ x: x + w, y, z: top }),
    project({ x: x + w, y: y + d, z: top }),
    project({ x, y: y + d, z: top }),
  ];
}

/** Projected centre of a box's top face: where links attach. */
function topMid(b: Box3): ScreenPoint {
  return project({ x: b.x + b.w / 2, y: b.y + b.d / 2, z: b.z + b.h });
}

type Placed = { e: Entity; ctx: FigureCtx; box: Box3 };

/** Where the label pill of an entity is centred: just above the highest point of its figure. */
function labelAnchor({ e, box }: Placed): ScreenPoint {
  if (e.kind === 'container') {
    // Just below the front-left edge, a few tiles in from the left corner: the camera frames the blocks,
    // not the whole platform, so the label sits near where the flow starts, past the actor in front.
    const edge = project({ x: e.pos.x + Math.min(5, e.size.w / 2), y: e.pos.y + e.size.d, z: e.pos.z ?? 0 });
    return { sx: edge.sx, sy: edge.sy + PILL_H / 2 + 10 };
  }
  return { sx: topMid(box).sx, sy: topFace(box)[0].sy - PILL_H / 2 - 6 };
}

/**
 * Screen-space bounds of an entity: its figure, its footprint and its label pill. A container counts
 * only its label: the camera frames the blocks standing on it and lets the platform run past the
 * canvas edge, instead of zooming out to show empty floor.
 */
function entityBounds(p: Placed): Box {
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  if (p.e.kind === 'container') {
    growPill(box, labelAnchor(p), p.e.label);
    return box;
  }
  for (const b of [p.box, { ...p.e.pos, z: p.e.pos.z ?? 0, ...p.e.size }]) {
    for (const [dx, dy, dz] of [[0, 0, 0], [b.w, 0, 0], [0, b.d, 0], [b.w, b.d, 0], [0, 0, b.h], [b.w, 0, b.h], [0, b.d, b.h], [b.w, b.d, b.h]]) {
      grow(box, project({ x: b.x + dx, y: b.y + dy, z: b.z + dz }));
    }
  }
  growPill(box, labelAnchor(p), p.e.label);
  return box;
}

function entityMarkup(p: Placed, bounds: Box, step?: StepState): string {
  const { e, ctx } = p;
  const a = labelAnchor(p);
  const fill = e.kind === 'container' ? 'var(--bg)' : 'var(--surface)';
  return (
    `<g class="iso-entity${stateClasses(step, { id: e.id })} kind-${e.kind} tone-${e.tone}" data-id="${escapeXml(e.id)}" data-bbox="${[bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].map(n).join(' ')}">` +
    figureMarkup(e, ctx) +
    `<g class="iso-label" transform="translate(${n(a.sx)} ${n(a.sy)})">${pillMarkup(e.label, 'iso-label', fill)}</g>` +
    `</g>`
  );
}

/** Ray from `c` towards `to`: parameter (0..1] where it leaves the figure's top face. */
function rimT(box: Box3, c: ScreenPoint, to: ScreenPoint): number {
  const dx = to.sx - c.sx;
  const dy = to.sy - c.sy;
  let best = 1;
  const face = topFace(box);
  for (let i = 0; i < face.length; i++) {
    const a = face[i];
    const b = face[(i + 1) % face.length];
    const ex = b.sx - a.sx;
    const ey = b.sy - a.sy;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a.sx - c.sx) * ey - (a.sy - c.sy) * ex) / den;
    const u = ((a.sx - c.sx) * dy - (a.sy - c.sy) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}

/** Parameter range [t0, t1] of the segment a→b inside the label pill of `p` (Liang–Barsky), or null. */
function labelSpan(p: Placed, a: ScreenPoint, b: ScreenPoint): [number, number] | null {
  const c = labelAnchor(p);
  const hw = pillWidth(p.e.label) / 2 + LABEL_CLEARANCE;
  const hh = PILL_H / 2 + LABEL_CLEARANCE;
  const dx = b.sx - a.sx;
  const dy = b.sy - a.sy;
  let t0 = 0;
  let t1 = 1;
  for (const [q, r] of [[-dx, a.sx - (c.sx - hw)], [dx, c.sx + hw - a.sx], [-dy, a.sy - (c.sy - hh)], [dy, c.sy + hh - a.sy]]) {
    if (q === 0) {
      if (r < 0) return null;
      continue;
    }
    const t = r / q;
    if (q < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
  }
  return t0 <= t1 ? [t0, t1] : null;
}

/** Room kept between a link and a label it would otherwise cross. */
const LABEL_CLEARANCE = 4;

const MARKER: Record<Link['style'], string> = {
  call: 'url(#iso-arrow)',
  implements: 'url(#iso-triangle)',
  injects: 'url(#iso-diamond)',
};

function linkMarkup(l: Link, byId: Map<string, Placed>, step?: StepState): string {
  const from = byId.get(l.from);
  const to = byId.get(l.to);
  if (!from || !to) throw new Error(`link "${l.id}" references a missing entity`);
  const c1 = topMid(from.box);
  const c2 = topMid(to.box);
  const len = Math.hypot(c2.sx - c1.sx, c2.sy - c1.sy) || 1;
  const gap = LINK_GAP / len;
  let t1 = Math.min(0.45, rimT(from.box, c1, c2) + gap);
  let t2 = Math.max(0.55, 1 - rimT(to.box, c2, c1) - gap);
  // A link heading up would run through its own block's label, and one arriving from above through
  // its target's: start past the first and stop short of the second (the arrow then points at the name).
  const out = labelSpan(from, c1, c2);
  if (out && out[0] < 0.5) t1 = Math.max(t1, out[1] + gap);
  const into = labelSpan(to, c1, c2);
  if (into && into[1] > 0.5) t2 = Math.min(t2, into[0] - gap);
  const at = (t: number): ScreenPoint => ({ sx: c1.sx + (c2.sx - c1.sx) * t, sy: c1.sy + (c2.sy - c1.sy) * t });
  const p1 = at(t1);
  const p2 = at(t2);
  return (
    `<g class="iso-link${stateClasses(step, l)} style-${l.style}" data-id="${escapeXml(l.id)}" data-from="${escapeXml(l.from)}" data-to="${escapeXml(l.to)}" ` +
    `data-x1="${n(c1.sx)}" data-y1="${n(c1.sy)}" data-x2="${n(c2.sx)}" data-y2="${n(c2.sy)}">` +
    `<path id="path-${escapeXml(l.id)}" class="iso-link-line" d="M${pt(p1)} L${pt(p2)}" marker-end="${MARKER[l.style]}"/>` +
    `</g>`
  );
}

// Markers take the link's colour via context-stroke (so highlighted links get
// accent arrowheads and several scenes on one page never share a stale
// colour); var(--ink) is the fallback for engines without context-stroke.
const DEFS =
  '<defs>' +
  '<marker id="iso-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">' +
  '<path d="M0,0 L10,5 L0,10 Z" style="fill:var(--ink);fill:context-stroke"/></marker>' +
  '<marker id="iso-triangle" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto">' +
  '<path d="M1,1 L13,7 L1,13 Z" style="fill:var(--surface);stroke:var(--ink);stroke:context-stroke;stroke-width:1.5;stroke-linejoin:round"/></marker>' +
  '<marker id="iso-diamond" viewBox="0 0 14 10" refX="13" refY="5" markerWidth="14" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">' +
  '<path d="M1,5 L7,1 L13,5 L7,9 Z" style="fill:var(--ink);fill:context-stroke"/></marker>' +
  '</defs>';

/** Packet markup: a small pill centred on (0,0), moved along a link by the player. */
export function packetMarkup(label: string): string {
  const w = packetWidth(label);
  return (
    `<rect class="iso-packet-pill" x="${n(-w / 2)}" y="${n(-PACKET_H / 2)}" width="${w}" height="${PACKET_H}" rx="${PACKET_H / 2}" style="fill:var(--accent-soft)"/>` +
    `<text class="iso-packet-text" x="0" y="0" dy="0.35em" text-anchor="middle" style="fill:var(--ink)">${escapeXml(label)}</text>`
  );
}

export type RenderOptions = {
  /** Bake this step's snapshot (visibility + highlight classes) into the markup, as the player would apply it. */
  step?: StepState;
  /** Accessible name of the diagram (`aria-label`). */
  label?: string;
  /** Id of the element describing the diagram (`aria-describedby`). */
  describedBy?: string;
};

export function renderScene(scene: Scene, opts: RenderOptions = {}): string {
  const { step, label, describedBy } = opts;
  const placed: Placed[] = scene.entities.map(e => {
    const ctx = figureCtx(e, scene.links);
    return { e, ctx, box: figureBox(e, ctx) };
  });
  const byId = new Map(placed.map(p => [p.e.id, p]));
  const ordered = placed
    .map((p, i) => ({ p, i }))
    .sort((a, b) => depth(a.p.e) - depth(b.p.e) || a.i - b.i)
    .map(({ p }) => p);

  const bounds = new Map(placed.map(p => [p.e.id, entityBounds(p)]));
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const b of bounds.values()) {
    grow(box, { sx: b.minX, sy: b.minY });
    grow(box, { sx: b.maxX, sy: b.maxY });
  }
  if (!Number.isFinite(box.minX)) Object.assign(box, { minX: 0, minY: 0, maxX: 0, maxY: 0 });

  const full: ViewBox = [box.minX - MARGIN, box.minY - MARGIN, box.maxX - box.minX + 2 * MARGIN, box.maxY - box.minY + 2 * MARGIN];
  // A wide, flat scene would make a strip of a canvas: keep at least 1 / MAX_ASPECT of height, centred.
  if (full[2] / full[3] > MAX_ASPECT) {
    const h = full[2] / MAX_ASPECT;
    full[1] -= (h - full[3]) / 2;
    full[3] = h;
  }
  // A baked step is framed like the player frames it, so the first paint doesn't jump when the script mounts.
  const vb = step ? fitViewBox(placed.filter(p => !itemState(step, { id: p.e.id }).hidden).map(p => bounds.get(p.e.id)!), full) : full;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="iso-scene" role="img"` +
    (label !== undefined ? ` aria-label="${escapeXml(label)}"` : '') +
    (describedBy !== undefined ? ` aria-describedby="${escapeXml(describedBy)}"` : '') +
    ` viewBox="${vb.map(n).join(' ')}" data-full-view="${full.map(n).join(' ')}">` +
    DEFS +
    `<g class="iso-entities">${ordered.map(p => entityMarkup(p, bounds.get(p.e.id)!, step)).join('')}</g>` +
    `<g class="iso-links">${scene.links.map(l => linkMarkup(l, byId, step)).join('')}</g>` +
    `<g class="iso-packets"></g>` +
    `</svg>`
  );
}
