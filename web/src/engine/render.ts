import { TILE_H, TILE_W, depth, project, topCenter, type ScreenPoint } from './iso';
import type { Entity, Link, Scene, SceneStep } from './types';

/**
 * Pure SVG string renderer for an isometric scene (spec §8.2).
 *
 * Painting rules: every colour is a `var(--…)` token. Fills that depend on the
 * entity tone are written inline (`--tone` is set per `.tone-*` class in
 * engine.css); outlines, dashes and state (`is-hidden`, `is-highlighted`) live
 * in engine.css so the player only toggles classes.
 */

export const MARGIN = 32;
const LABEL_FONT = 11;
const CHAR_W = LABEL_FONT * 0.62; // monospace advance
const LINK_GAP = 6; // px between a link end and the entity rim

const FILL_TOP = 'fill:var(--surface)';
/** Platforms sit a step below the blocks they hold. */
const FILL_FLOOR = 'fill:color-mix(in srgb, var(--tone) 10%, var(--bg))';
const FILL_LEFT = 'fill:color-mix(in srgb, var(--tone) 35%, var(--surface))';
const FILL_RIGHT = 'fill:color-mix(in srgb, var(--tone) 55%, var(--surface))';

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

/** Width of a label pill for `text`, shared by entity labels and packets. */
export function pillWidth(text: string): number {
  return Math.ceil(text.length * CHAR_W + 18);
}

export const PILL_H = 20;

/** Pill markup centred on (0, cy); `cls` prefixes the rect/text classes. */
export function pillMarkup(text: string, cls: string, fill: string, cy = 0): string {
  const w = pillWidth(text);
  return (
    `<rect class="${cls}-pill" x="${n(-w / 2)}" y="${n(cy - PILL_H / 2)}" width="${w}" height="${PILL_H}" rx="${PILL_H / 2}" style="fill:${fill}"/>` +
    `<text class="${cls}-text" x="0" y="${n(cy)}" dy="0.35em" text-anchor="middle" style="fill:var(--ink)">${escapeXml(text)}</text>`
  );
}

type Box = { minX: number; minY: number; maxX: number; maxY: number };

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

/** The 4 projected corners of the top face, in order back, right, front, left. */
function topFace(e: Entity): ScreenPoint[] {
  const { x, y } = e.pos;
  const top = (e.pos.z ?? 0) + e.size.h;
  const { w, d } = e.size;
  return [
    project({ x, y, z: top }),
    project({ x: x + w, y, z: top }),
    project({ x: x + w, y: y + d, z: top }),
    project({ x, y: y + d, z: top }),
  ];
}

function actorRadii(e: Entity): { rx: number; ry: number } {
  const r = Math.min(e.size.w, e.size.d) / 2;
  const rx = r * Math.SQRT2 * (TILE_W / 2);
  return { rx, ry: rx * (TILE_H / TILE_W) };
}

/** Where the label pill of an entity is centred. */
function labelAnchor(e: Entity): ScreenPoint {
  const face = topFace(e);
  if (e.kind === 'container') {
    // Just below the middle of the front-left edge, clear of the blocks it holds.
    const edge = project({ x: e.pos.x + e.size.w / 2, y: e.pos.y + e.size.d, z: e.pos.z ?? 0 });
    return { sx: edge.sx, sy: edge.sy + PILL_H / 2 + 10 };
  }
  const c = topCenter(e);
  const topY = e.kind === 'actor' ? c.sy - actorRadii(e).ry - 16 : face[0].sy;
  return { sx: c.sx, sy: topY - PILL_H / 2 - 6 };
}

function prismMarkup(e: Entity): string {
  const { x, y } = e.pos;
  const z = e.pos.z ?? 0;
  const { w, d } = e.size;
  const face = topFace(e);
  const [, right, front, left] = face;
  const rightB = project({ x: x + w, y, z });
  const frontB = project({ x: x + w, y: y + d, z });
  const leftB = project({ x, y: y + d, z });
  return (
    `<polygon class="iso-face face-left" points="${[left, front, frontB, leftB].map(pt).join(' ')}" style="${FILL_LEFT}"/>` +
    `<polygon class="iso-face face-right" points="${[front, right, rightB, frontB].map(pt).join(' ')}" style="${FILL_RIGHT}"/>` +
    `<polygon class="iso-face face-top" points="${face.map(pt).join(' ')}" style="${e.kind === 'container' ? FILL_FLOOR : FILL_TOP}"/>`
  );
}

function actorMarkup(e: Entity): string {
  const z = e.pos.z ?? 0;
  const c = topCenter(e);
  const base = project({ x: e.pos.x + e.size.w / 2, y: e.pos.y + e.size.d / 2, z });
  const { rx, ry } = actorRadii(e);
  const side =
    `M${n(c.sx - rx)},${n(c.sy)} L${n(base.sx - rx)},${n(base.sy)} ` +
    `A${n(rx)},${n(ry)} 0 0 0 ${n(base.sx + rx)},${n(base.sy)} L${n(c.sx + rx)},${n(c.sy)} Z`;
  // Person glyph standing on the token: shoulders + head.
  const s = Math.max(6, ry * 0.75);
  const feet = c.sy + ry * 0.15;
  const glyph =
    `<path class="iso-glyph" d="M${n(c.sx - s)},${n(feet)} Q${n(c.sx - s)},${n(feet - s * 1.2)} ${n(c.sx)},${n(feet - s * 1.2)} ` +
    `Q${n(c.sx + s)},${n(feet - s * 1.2)} ${n(c.sx + s)},${n(feet)} Z" style="fill:var(--ink)"/>` +
    `<circle class="iso-glyph" cx="${n(c.sx)}" cy="${n(feet - s * 1.85)}" r="${n(s * 0.55)}" style="fill:var(--ink)"/>`;
  return (
    `<path class="iso-face face-side" d="${side}" style="${FILL_RIGHT}"/>` +
    `<ellipse class="iso-face face-top" cx="${n(c.sx)}" cy="${n(c.sy)}" rx="${n(rx)}" ry="${n(ry)}" style="${FILL_TOP}"/>` +
    glyph
  );
}

function entityMarkup(e: Entity, step?: StepState): string {
  const shape = e.kind === 'actor' ? actorMarkup(e) : prismMarkup(e);
  const a = labelAnchor(e);
  const fill = e.kind === 'container' ? 'var(--bg)' : 'var(--surface)';
  return (
    `<g class="iso-entity${stateClasses(step, { id: e.id })} kind-${e.kind} tone-${e.tone}" data-id="${escapeXml(e.id)}">` +
    shape +
    `<g class="iso-label" transform="translate(${n(a.sx)} ${n(a.sy)})">${pillMarkup(e.label, 'iso-label', fill)}</g>` +
    `</g>`
  );
}

/** Ray from `c` towards `to`: parameter (0..1] where it leaves the entity's top face. */
function rimT(e: Entity, c: ScreenPoint, to: ScreenPoint): number {
  const dx = to.sx - c.sx;
  const dy = to.sy - c.sy;
  if (e.kind === 'actor') {
    const { rx, ry } = actorRadii(e);
    const k = Math.hypot(dx / rx, dy / ry);
    return k === 0 ? 0 : 1 / k;
  }
  let best = 1;
  const face = topFace(e);
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

const MARKER: Record<Link['style'], string> = {
  call: 'url(#iso-arrow)',
  implements: 'url(#iso-triangle)',
  injects: 'url(#iso-diamond)',
};

function linkMarkup(l: Link, byId: Map<string, Entity>, step?: StepState): string {
  const from = byId.get(l.from);
  const to = byId.get(l.to);
  if (!from || !to) throw new Error(`link "${l.id}" references a missing entity`);
  const c1 = topCenter(from);
  const c2 = topCenter(to);
  const len = Math.hypot(c2.sx - c1.sx, c2.sy - c1.sy) || 1;
  const gap = LINK_GAP / len;
  const t1 = Math.min(0.45, rimT(from, c1, c2) + gap);
  const t2 = Math.max(0.55, 1 - rimT(to, c2, c1) - gap);
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

/** Packet markup: a label pill centred on (0,0), moved along a link by the player. */
export function packetMarkup(label: string): string {
  return pillMarkup(label, 'iso-packet', 'var(--accent-soft)');
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
  const byId = new Map(scene.entities.map(e => [e.id, e]));
  const ordered = scene.entities
    .map((e, i) => ({ e, i }))
    .sort((a, b) => depth(a.e) - depth(b.e) || a.i - b.i)
    .map(({ e }) => e);

  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const e of scene.entities) {
    const { x, y } = e.pos;
    const z = e.pos.z ?? 0;
    const { w, d, h } = e.size;
    for (const [dx, dy, dz] of [[0, 0, 0], [w, 0, 0], [0, d, 0], [w, d, 0], [0, 0, h], [w, 0, h], [0, d, h], [w, d, h]]) {
      grow(box, project({ x: x + dx, y: y + dy, z: z + dz }));
    }
    if (e.kind === 'actor') {
      const c = topCenter(e);
      const { rx, ry } = actorRadii(e);
      grow(box, { sx: c.sx - rx, sy: c.sy - ry });
      grow(box, { sx: c.sx + rx, sy: c.sy + ry + e.size.h * TILE_H });
    }
    growPill(box, labelAnchor(e), e.label);
  }
  if (!Number.isFinite(box.minX)) Object.assign(box, { minX: 0, minY: 0, maxX: 0, maxY: 0 });

  const vb = [box.minX - MARGIN, box.minY - MARGIN, box.maxX - box.minX + 2 * MARGIN, box.maxY - box.minY + 2 * MARGIN];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="iso-scene" role="img"` +
    (label !== undefined ? ` aria-label="${escapeXml(label)}"` : '') +
    (describedBy !== undefined ? ` aria-describedby="${escapeXml(describedBy)}"` : '') +
    ` viewBox="${vb.map(n).join(' ')}">` +
    DEFS +
    `<g class="iso-entities">${ordered.map(e => entityMarkup(e, step)).join('')}</g>` +
    `<g class="iso-links">${scene.links.map(l => linkMarkup(l, byId, step)).join('')}</g>` +
    `<g class="iso-packets"></g>` +
    `</svg>`
  );
}
