import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

/*
 * Diagram legibility guard: on every step of every lesson, with packets parked where the player
 * leaves them, no label, block figure or packet may overlap another, and no link may run through
 * a label. Measured in the browser on the real build at 1440px.
 */

const lessonsDir = fileURLToPath(new URL('../../src/content/lessons', import.meta.url));
const slugs = readdirSync(lessonsDir).filter(s => !s.startsWith('_'));

/** Overlap tolerance: a touch smaller than this share of the smaller box (or 30 px²) is not reported. */
const TOLERANCE = 0.1;

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

for (const slug of slugs) {
  test(`${slug}: no overlaps in any step`, async ({ page }) => {
    await page.goto(`/es/patterns/${slug}/`);
    const ids = await page.$$eval('.step-text', els => els.map(e => (e as HTMLElement).dataset.stepId!));
    const problems: string[] = [];
    for (const id of ids) {
      await page.evaluate(h => (location.hash = h), `#step-${id}`);
      await expect(page.locator('[data-lesson]')).toHaveAttribute('data-step', id);
      const found = await page.evaluate(tolerance => {
        type B = { x1: number; y1: number; x2: number; y2: number };
        const svg = document.querySelector<SVGSVGElement>('.iso-scene')!;
        const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const box = (r: DOMRect | { left: number; top: number; right: number; bottom: number }): B => ({ x1: r.left / k, y1: r.top / k, x2: r.right / k, y2: r.bottom / k });
        const items: { t: string; id: string; b: B; floor?: boolean }[] = [];
        for (const g of svg.querySelectorAll<SVGGElement>('.iso-entity:not(.is-hidden)')) {
          const id = g.dataset.id!;
          const floor = g.classList.contains('kind-container');
          items.push({ t: 'label', id, b: box(g.querySelector('.iso-label-pill')!.getBoundingClientRect()), floor });
          if (floor) continue;
          let r: { left: number; top: number; right: number; bottom: number } | null = null;
          for (const c of g.children) {
            if (c.classList.contains('iso-label')) continue;
            const q = c.getBoundingClientRect();
            if (!q.width) continue;
            r = r ? { left: Math.min(r.left, q.left), top: Math.min(r.top, q.top), right: Math.max(r.right, q.right), bottom: Math.max(r.bottom, q.bottom) } : q;
          }
          if (!r) continue;
          // Isometric figures leave empty corners in their bounding box: shrink it a little.
          const b = box(r);
          const sx = (b.x2 - b.x1) * 0.12;
          const sy = (b.y2 - b.y1) * 0.12;
          items.push({ t: 'figure', id, b: { x1: b.x1 + sx, y1: b.y1 + sy, x2: b.x2 - sx, y2: b.y2 - sy } });
        }
        for (const [n, g] of [...svg.querySelectorAll('.iso-packet')].entries()) {
          items.push({ t: 'packet', id: `${n}:${g.textContent!.trim()}`, b: box(g.querySelector('rect')!.getBoundingClientRect()) });
        }
        // Nothing the reader needs may be cut by the canvas edge (platforms may: they are floor).
        const view = box(svg.getBoundingClientRect());
        const out: string[] = [];
        for (const it of items)
          if (it.t !== 'figure' && !it.floor && (it.b.x1 < view.x1 - 1 || it.b.x2 > view.x2 + 1 || it.b.y1 < view.y1 - 1 || it.b.y2 > view.y2 + 1))
            out.push(`${it.t} ${it.id} cut by the canvas edge`);
        const area = (b: B) => (b.x2 - b.x1) * (b.y2 - b.y1);
        const overlap = (a: B, c: B) => Math.max(0, Math.min(a.x2, c.x2) - Math.max(a.x1, c.x1)) * Math.max(0, Math.min(a.y2, c.y2) - Math.max(a.y1, c.y1));
        for (let i = 0; i < items.length; i++)
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const c = items[j];
            if (a.id === c.id && a.t !== 'packet') continue; // an entity's own label and figure
            const o = overlap(a.b, c.b);
            if (o > 30 && o / Math.min(area(a.b), area(c.b)) > tolerance) out.push(`${a.t} ${a.id} × ${c.t} ${c.id}`);
          }
        // Links: sample the drawn path (arrowhead end included) against every non-container label.
        const labels = items.filter(it => it.t === 'label' && !it.floor);
        for (const g of svg.querySelectorAll<SVGGElement>('.iso-link:not(.is-hidden)')) {
          const path = g.querySelector('path')!;
          const m = path.getScreenCTM()!;
          const len = path.getTotalLength();
          for (const lb of labels) {
            for (let t = 0; t <= 1.0001; t += 0.04) {
              const q = path.getPointAtLength(t * len);
              const p = new DOMPoint(q.x, q.y).matrixTransform(m);
              const x = p.x / k;
              const y = p.y / k;
              if (x > lb.b.x1 + 2 && x < lb.b.x2 - 2 && y > lb.b.y1 + 2 && y < lb.b.y2 - 2) {
                out.push(`link ${g.dataset.id} × label ${lb.id}`);
                break;
              }
            }
          }
        }
        return out;
      }, TOLERANCE);
      problems.push(...found.map(f => `${id}: ${f}`));
    }
    expect(problems).toEqual([]);
  });
}
