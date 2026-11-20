import { fitViewBox, itemState, packetBox, packetMarkup, packetWidth, parseBox, type Box, type ViewBox } from './render';
import { tween, type Tween } from './tween';
import type { Packet, Scene, SceneStep } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const PACKET_MS = 600;
/** How long the camera takes to reframe between steps. */
export const ZOOM_MS = 450;
/** Gap kept between a departing packet pill and the link end it leaves (arrowheads are 10–14 px). */
const ARROW_CLEARANCE = 14;

export type LessonPlayerOptions = {
  onStep?: (index: number) => void;
  reducedMotion?: boolean;
};

type Pt = { x: number; y: number };

/** Key events from inside these keep their native meaning instead of changing step. */
const NATIVE_KEYS_SELECTOR = 'input, select, textarea, [contenteditable]:not([contenteditable="false"]), form, pre';

/**
 * Drives a scene rendered by `renderScene` (spec §8.3).
 *
 * Every `goTo` cancels running tweens, discards packet elements, applies the
 * target step's snapshot (visibility + highlight classes) and then plays that
 * step's packets one after another. A generation counter guarantees that a
 * superseded animation never touches the DOM again, so after any sequence of
 * calls the DOM shows exactly the last requested step and no orphan packets.
 */
export class LessonPlayer {
  private current = 0;
  private generation = 0;
  private running: Tween | null = null;
  private zooming: Tween | null = null;
  private framed = false;
  private readonly svg: SVGSVGElement | null;
  private readonly packetLayer: Element | null;
  private readonly reducedMotion: boolean;
  private readonly onKey = (ev: KeyboardEvent) => this.handleKey(ev);

  constructor(
    private readonly root: HTMLElement,
    private readonly scene: Scene,
    private readonly opts: LessonPlayerOptions = {},
  ) {
    if (scene.steps.length === 0) throw new Error('LessonPlayer: scene has no steps');
    this.svg = root.querySelector('svg');
    this.packetLayer = root.querySelector('.iso-packets');
    this.reducedMotion = opts.reducedMotion ?? prefersReducedMotion();
    if (!root.hasAttribute('tabindex')) root.tabIndex = 0;
    root.addEventListener('keydown', this.onKey);
    this.goTo(0);
  }

  get index(): number {
    return this.current;
  }

  goTo(index: number): void {
    const n = this.scene.steps.length;
    const i = Math.min(n - 1, Math.max(0, Math.trunc(index) || 0));
    this.stopAnimation();
    this.current = i;
    const step = this.scene.steps[i];
    this.applySnapshot(step);
    this.opts.onStep?.(i);
    void this.playPackets(step, this.generation);
  }

  next(): void {
    this.goTo(this.current + 1);
  }

  prev(): void {
    this.goTo(this.current - 1);
  }

  destroy(): void {
    this.stopAnimation();
    this.zooming?.cancel();
    this.root.removeEventListener('keydown', this.onKey);
  }

  private handleKey(ev: KeyboardEvent): void {
    // Modified keys belong to the browser (Alt+←/→ is history navigation), and
    // keys typed inside controls, forms or code keep their native behaviour
    // (radio groups move with arrows, wide <pre> blocks scroll sideways).
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    const native = ev.target instanceof Element ? ev.target.closest(NATIVE_KEYS_SELECTOR) : null;
    if (native && native !== this.root && this.root.contains(native)) return;
    const target: Record<string, number> = {
      ArrowRight: this.current + 1,
      ArrowLeft: this.current - 1,
      Home: 0,
      End: this.scene.steps.length - 1,
    };
    if (!(ev.key in target)) return;
    ev.preventDefault();
    this.goTo(target[ev.key]);
  }

  /** Cancels the running tween, invalidates pending packet loops and removes packets. */
  private stopAnimation(): void {
    this.generation++;
    this.running?.cancel();
    this.running = null;
    this.packetLayer?.replaceChildren();
  }

  private applySnapshot(step: SceneStep): void {
    for (const el of this.root.querySelectorAll<SVGGElement>('.iso-entity, .iso-link')) {
      const { id = '', from, to } = el.dataset;
      const item = el.classList.contains('iso-link') ? { id, from: from ?? '', to: to ?? '' } : { id };
      const { hidden, highlighted } = itemState(step, item);
      el.classList.toggle('is-hidden', hidden);
      el.classList.toggle('is-highlighted', highlighted);
    }
    this.reframe();
    this.root.dataset.step = step.id;
    this.svg?.setAttribute('aria-describedby', `describe-${step.id}`);
  }

  /** Moves the camera (the svg viewBox) to frame the visible entities; snaps on the first step or with reduced motion. */
  private reframe(): void {
    const svg = this.svg;
    const full = parseView(svg?.dataset.fullView);
    if (!svg || !full) return;
    const visible: Box[] = [];
    for (const el of svg.querySelectorAll<SVGGElement>('.iso-entity:not(.is-hidden)')) {
      const b = parseBox(el.dataset.bbox);
      if (b) visible.push(b);
    }
    // Packets park mid-link: keep their pills in frame too, so a long message is never cut by the canvas edge.
    for (const pk of this.scene.steps[this.current].packets) {
      const link = svg.querySelector<SVGGElement>(`.iso-link[data-id="${cssEscape(pk.link)}"]`);
      const mx = Number(link?.dataset.mx);
      const my = Number(link?.dataset.my);
      if (Number.isFinite(mx) && Number.isFinite(my) && link) visible.push(packetBox(mx, my, pk.label));
    }
    const to = fitViewBox(visible, full);
    const from = parseView(svg.getAttribute('viewBox') ?? undefined) ?? to;
    this.zooming?.cancel();
    this.zooming = null;
    const set = (v: ViewBox) => svg.setAttribute('viewBox', v.map(x => String(Math.round(x * 100) / 100)).join(' '));
    centreStage(svg);
    if (!this.framed || this.reducedMotion || from.every((v, i) => Math.abs(v - to[i]) < 0.5)) {
      this.framed = true;
      set(to);
      return;
    }
    this.zooming = tween(ZOOM_MS, t => set(from.map((v, i) => v + (to[i] - v) * t) as ViewBox));
  }

  private async playPackets(step: SceneStep, gen: number): Promise<void> {
    for (const packet of step.packets) {
      if (gen !== this.generation) return;
      const at = this.createPacket(packet);
      if (!at) continue;
      if (this.reducedMotion) {
        at(1);
        continue;
      }
      at(0);
      this.running = tween(PACKET_MS, t => at(t));
      await this.running.finished;
      if (gen !== this.generation) return;
      this.running = null;
      at(1); // exact resting position regardless of the last frame
    }
  }

  /** Builds the packet pill and a positioner `at(t)` along its link (t = travel progress). */
  private createPacket(packet: Packet): ((t: number) => void) | null {
    const link = this.root.querySelector<SVGGElement>(`.iso-link[data-id="${cssEscape(packet.link)}"]`);
    if (!link || !this.packetLayer) return null;
    const a: Pt = { x: Number(link.dataset.x1), y: Number(link.dataset.y1) };
    const b: Pt = { x: Number(link.dataset.x2), y: Number(link.dataset.y2) };
    const path = link.querySelector<SVGPathElement>('path');
    const [start, end] = packet.reverse ? [b, a] : [a, b];

    // A new message on a link replaces the one resting there (a reply takes the request's place).
    for (const old of this.packetLayer.querySelectorAll<SVGGElement>('.iso-packet')) {
      if (old.dataset.link === packet.link) old.remove();
    }
    const el = document.createElementNS(SVG_NS, 'g');
    el.setAttribute('class', 'iso-packet');
    el.dataset.link = packet.link;
    el.innerHTML = packetMarkup(packet.label);
    this.packetLayer.append(el);

    // In browsers the pill leaves its source (inset by half its width, so it
    // starts clear of the figure) and parks in the middle of the drawn path,
    // like a label on the arrow: as far as it can be from both entities and
    // their labels. happy-dom has no getPointAtLength, so there it interpolates
    // from the source to the midpoint of the stored endpoints.
    const inset = packetWidth(packet.label) / 2 + ARROW_CLEARANCE;
    const mid = lerp(start, end, 0.5);
    const at = (t: number) => {
      const p = pointOnPath(path, t, inset, !!packet.reverse) ?? lerp(start, mid, t);
      el.setAttribute('transform', `translate(${round(p.x)} ${round(p.y)})`);
    };
    return at;
  }
}

/** Point at travel progress `t` from the source end (inset) to the middle of the path. */
function pointOnPath(path: SVGPathElement | null, t: number, inset: number, reverse: boolean): Pt | null {
  if (!path || typeof path.getTotalLength !== 'function' || typeof path.getPointAtLength !== 'function') return null;
  try {
    const total = path.getTotalLength();
    if (!(total > 0)) return null;
    const pad = Math.min(inset, total / 2);
    const along = pad + t * (total / 2 - pad);
    const p = path.getPointAtLength(reverse ? total - along : along);
    return { x: p.x, y: p.y };
  } catch {
    return null;
  }
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const round = (v: number): number => Math.round(v * 100) / 100 + 0;

/** On narrow screens the stage scrolls sideways (lesson.css): keep the framed step in the middle. */
function centreStage(svg: SVGSVGElement): void {
  const stage = svg.parentElement;
  if (stage && stage.scrollWidth > stage.clientWidth) stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
}

function parseView(attr: string | undefined): ViewBox | null {
  const v = (attr ?? '').split(' ').map(Number);
  return v.length === 4 && v.every(Number.isFinite) && v[2] > 0 && v[3] > 0 ? (v as ViewBox) : null;
}

function cssEscape(s: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&');
}

function prefersReducedMotion(): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
