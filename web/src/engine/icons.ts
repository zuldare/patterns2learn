import { project, type ScreenPoint } from './iso';

/**
 * Icon catalogue and face decals for the "Taller" figures (ADR 0001).
 *
 * Icons are drawn in the unit square (0..1) and mapped onto a face of a box
 * with an affine matrix, so they land in isometric perspective. Strokes use
 * `vector-effect:non-scaling-stroke` so the matrix does not distort them, and
 * every colour is a token.
 */

export const ICON_NAMES = ['gear', 'arrow-in', 'calendar', 'ten', 'ticket', 'cap', 'key', 'warning', 'leaf', 'board', 'timer', 'shield', 'db', 'file', 'bell', 'medal'] as const;
export type IconName = (typeof ICON_NAMES)[number];

export function isIconName(v: unknown): v is IconName {
  return typeof v === 'string' && (ICON_NAMES as readonly string[]).includes(v);
}

export type Face = 'top' | 'left' | 'right';
export type Box3 = { x: number; y: number; z: number; w: number; d: number; h: number };

export const n = (v: number): string => String(Math.round(v * 100) / 100 + 0);

const STROKE = 'stroke:var(--ink);stroke-width:1.5px;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke';
/** Inline style attribute for a unit-square shape: ink stroke plus `extra`. */
export const st = (extra = ''): string => `style="${STROKE}${extra ? `;${extra}` : ''}"`;
/**
 * Text in unit-square coordinates. It is set at 100× the size and scaled back
 * down, so browser minimum-font-size settings never inflate it.
 */
export const unitText = (x: number, y: number, size: number, text: string, fill = 'var(--ink)'): string =>
  `<text transform="translate(${x} ${y}) scale(.01)" text-anchor="middle" style="font-size:${n(size * 100)}px;font-weight:700;fill:${fill}">${text}</text>`;
const label = unitText;

function gear(): string {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const p = (r: number) => `${n(0.5 + Math.cos(a) * r)}`;
    const q = (r: number) => `${n(0.5 + Math.sin(a) * r)}`;
    return `<line x1="${p(0.22)}" y1="${q(0.22)}" x2="${p(0.34)}" y2="${q(0.34)}" ${st('stroke-width:3px')}/>`;
  }).join('');
  return teeth + `<circle cx=".5" cy=".5" r=".22" ${st('fill:var(--surface)')}/><circle cx=".5" cy=".5" r=".08" ${st('fill:var(--ink)')}/>`;
}

const ICONS: Record<IconName, () => string> = {
  gear,
  'arrow-in': () =>
    `<path d="M.15 .5 H.62 M.48 .34 L.64 .5 L.48 .66" ${st('fill:none;stroke-width:2.5px')}/><path d="M.72 .2 V.8" ${st('stroke-width:2.5px')}/>`,
  calendar: () =>
    `<rect x=".18" y=".22" width=".64" height=".6" rx=".06" ${st('fill:var(--surface)')}/>` +
    `<rect x=".18" y=".22" width=".64" height=".16" ${st('fill:var(--accent)')}/>` +
    label(0.5, 0.72, 0.32, '30'),
  ten: () => `<rect x=".14" y=".26" width=".72" height=".48" rx=".08" ${st('fill:var(--surface)')}/>` + label(0.5, 0.62, 0.34, '×10'),
  ticket: () =>
    `<path d="M.15 .3 H.85 V.43 A.07 .07 0 0 0 .85 .57 V.7 H.15 V.57 A.07 .07 0 0 0 .15 .43 Z" ${st('fill:var(--surface)')}/>` +
    `<path d="M.62 .32 V.68" ${st('stroke-dasharray:2 2')}/>`,
  cap: () =>
    `<path d="M.5 .2 L.9 .4 L.5 .6 L.1 .4 Z" ${st('fill:var(--ink)')}/>` +
    `<path d="M.28 .5 V.7 Q.5 .82 .72 .7 V.5" ${st('fill:var(--surface)')}/>` +
    `<path d="M.82 .44 V.72" ${st('stroke:var(--accent-strong);stroke-width:2.5px')}/>`,
  key: () => `<circle cx=".32" cy=".5" r=".14" ${st('fill:var(--surface)')}/><path d="M.46 .5 H.86 M.74 .5 V.64 M.84 .5 V.6" ${st('fill:none;stroke-width:2.5px')}/>`,
  warning: () =>
    `<path d="M.5 .16 L.88 .82 H.12 Z" ${st('fill:var(--warn)')}/><path d="M.5 .38 V.6" ${st('stroke-width:3px')}/><circle cx=".5" cy=".7" r=".03" ${st('fill:var(--ink)')}/>`,
  board: () =>
    `<rect x=".14" y=".16" width=".72" height=".62" rx=".04" ${st('fill:var(--surface)')}/>` +
    `<rect x=".14" y=".16" width=".72" height=".14" ${st('fill:var(--accent)')}/>` +
    `<path d="M.24 .42 H.7 M.24 .54 H.6 M.24 .66 H.66" ${st('fill:none;stroke-width:1px')}/>` +
    `<path d="M.3 .78 L.24 .9 M.7 .78 L.76 .9" ${st('fill:none')}/>`,
  timer: () =>
    `<circle cx=".5" cy=".56" r=".3" ${st('fill:var(--surface)')}/>` +
    `<path d="M.44 .14 H.56 M.5 .14 V.26" ${st('fill:none;stroke-width:2.5px')}/>` +
    `<path d="M.5 .56 L.5 .38 M.5 .56 L.64 .64" ${st('fill:none;stroke:var(--accent-strong);stroke-width:2.5px')}/>`,
  shield: () =>
    `<path d="M.5 .12 L.84 .26 V.5 C.84 .7 .68 .84 .5 .9 C.32 .84 .16 .7 .16 .5 V.26 Z" ${st('fill:var(--surface)')}/>` +
    `<path d="M.34 .5 L.46 .62 L.68 .38" ${st('fill:none;stroke:var(--accent-strong);stroke-width:2.5px')}/>`,
  db: () =>
    `<path d="M.22 .26 V.74 A.28 .1 0 0 0 .78 .74 V.26" ${st('fill:var(--surface)')}/>` +
    `<ellipse cx=".5" cy=".26" rx=".28" ry=".1" ${st('fill:var(--surface)')}/>` +
    `<path d="M.22 .42 A.28 .1 0 0 0 .78 .42 M.22 .58 A.28 .1 0 0 0 .78 .58" ${st('fill:none;stroke-width:1px')}/>`,
  file: () =>
    `<path d="M.26 .12 H.6 L.76 .28 V.88 H.26 Z" ${st('fill:var(--surface)')}/>` +
    `<path d="M.6 .12 V.28 H.76" ${st('fill:none')}/>` +
    `<path d="M.36 .46 H.66 M.36 .58 H.66 M.36 .7 H.56" ${st('fill:none;stroke-width:1px')}/>`,
  bell: () =>
    `<path d="M.3 .66 V.46 C.3 .3 .4 .2 .5 .2 C.6 .2 .7 .3 .7 .46 V.66 L.78 .74 H.22 Z" ${st('fill:var(--surface)')}/>` +
    `<path d="M.44 .8 Q.5 .88 .56 .8" ${st('fill:none')}/>` +
    `<circle cx=".72" cy=".24" r=".07" ${st('fill:var(--accent)')}/>`,
  medal: () =>
    `<path d="M.36 .12 L.46 .42 M.64 .12 L.54 .42" ${st('fill:none;stroke:var(--accent-strong);stroke-width:2.5px')}/>` +
    `<circle cx=".5" cy=".62" r=".22" ${st('fill:var(--warn)')}/>` +
    `<circle cx=".5" cy=".62" r=".1" ${st('fill:var(--surface)')}/>`,
  leaf: () => `<path d="M.2 .8 C.2 .35 .5 .15 .85 .15 C.85 .55 .6 .8 .2 .8 Z" ${st('fill:var(--accent)')}/><path d="M.2 .8 L.6 .4" ${st('fill:none')}/>`,
};

export function iconMarkup(name: IconName): string {
  return ICONS[name]();
}

/** Affine matrix mapping the unit square onto `face` of box `b` (face conventions as in render.ts). */
export function faceMatrix(face: Face, b: Box3): string {
  const { x, y, z, w, d, h } = b;
  let o: ScreenPoint, u: ScreenPoint, v: ScreenPoint;
  if (face === 'top') {
    o = project({ x, y, z: z + h });
    u = project({ x: x + w, y, z: z + h });
    v = project({ x, y: y + d, z: z + h });
  } else if (face === 'left') {
    o = project({ x, y: y + d, z: z + h });
    u = project({ x: x + w, y: y + d, z: z + h });
    v = project({ x, y: y + d, z });
  } else {
    o = project({ x: x + w, y: y + d, z: z + h });
    u = project({ x: x + w, y, z: z + h });
    v = project({ x: x + w, y: y + d, z });
  }
  return `matrix(${[u.sx - o.sx, u.sy - o.sy, v.sx - o.sx, v.sy - o.sy, o.sx, o.sy].map(n).join(' ')})`;
}

export function decal(face: Face, b: Box3, body: string, cls?: string): string {
  return `<g class="fig-decal${cls ? ` ${cls}` : ''}" transform="${faceMatrix(face, b)}">${body}</g>`;
}
