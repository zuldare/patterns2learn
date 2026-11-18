import { packetMarkup, pillWidth } from './render';
import { tween, type Tween } from './tween';
import type { Packet, Scene, SceneStep } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const PACKET_MS = 600;
/** Gap kept between a resting packet pill and the link end (arrowheads are 10–14 px). */
const ARROW_CLEARANCE = 14;

export type LessonPlayerOptions = {
  onStep?: (index: number) => void;
  reducedMotion?: boolean;
};

type Pt = { x: number; y: number };

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
    this.root.removeEventListener('keydown', this.onKey);
  }

  private handleKey(ev: KeyboardEvent): void {
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
    const visible = new Set(step.visible);
    const highlight = new Set(step.highlight);
    for (const el of this.root.querySelectorAll<SVGGElement>('.iso-entity')) {
      const id = el.dataset.id ?? '';
      el.classList.toggle('is-hidden', !visible.has(id));
      el.classList.toggle('is-highlighted', highlight.has(id));
    }
    for (const el of this.root.querySelectorAll<SVGGElement>('.iso-link')) {
      const id = el.dataset.id ?? '';
      const shown = visible.has(el.dataset.from ?? '') && visible.has(el.dataset.to ?? '');
      el.classList.toggle('is-hidden', !shown);
      el.classList.toggle('is-highlighted', highlight.has(id));
    }
    this.root.dataset.step = step.id;
    this.svg?.setAttribute('aria-describedby', `describe-${step.id}`);
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

    const el = document.createElementNS(SVG_NS, 'g');
    el.setAttribute('class', 'iso-packet');
    el.dataset.link = packet.link;
    el.innerHTML = packetMarkup(packet.label);
    this.packetLayer.append(el);

    // In browsers the pill follows the drawn path, inset by half its width at
    // both ends so at rest it sits on the link just before the arrowhead
    // instead of covering the entity or its label. happy-dom has no
    // getPointAtLength, so there it interpolates between the stored endpoints.
    const inset = pillWidth(packet.label) / 2 + ARROW_CLEARANCE;
    const at = (t: number) => {
      const p = pointOnPath(path, packet.reverse ? 1 - t : t, inset) ?? lerp(start, end, t);
      el.setAttribute('transform', `translate(${round(p.x)} ${round(p.y)})`);
    };
    return at;
  }
}

function pointOnPath(path: SVGPathElement | null, t: number, inset: number): Pt | null {
  if (!path || typeof path.getTotalLength !== 'function' || typeof path.getPointAtLength !== 'function') return null;
  try {
    const total = path.getTotalLength();
    if (!(total > 0)) return null;
    const pad = Math.min(inset, total / 2);
    const p = path.getPointAtLength(pad + t * (total - 2 * pad));
    return { x: p.x, y: p.y };
  } catch {
    return null;
  }
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const round = (v: number): number => Math.round(v * 100) / 100 + 0;

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
