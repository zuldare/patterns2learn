# Figures "Taller" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the identical grey prisms of the isometric engine with the "Taller" figures:
- machines with icon decals and LEDs,
- a socket board for interfaces,
- cartridges for implementations,
- a voxel athlete,
- a platform with a grid and the Spring leaf.

**Architecture:**
- `Entity` gains an optional `icon`.
- Two new engine modules:
  - `icons.ts` holds the icons and the face decals.
  - `figures.ts` picks a figure from `kind` and the scene's `implements` links, then draws it.
- `render.ts` delegates entity shapes to `figures.ts`, and takes label, link-rim and viewBox geometry from each figure's height and footprint.
- The spike in `src/lab/skins.ts` is the visual reference and is deleted at the end. `/lab/figuras/` becomes a living gallery on the real engine.

**Tech Stack:** Astro 7.4.12, TypeScript 6 strict, Vitest 5 + happy-dom, Playwright 1.65, pnpm 12.21.0 (run everything from `web/`).

**Spec:** `docs/superpowers/specs/2026-11-19-figures-taller-design.md`. The parent spec is `docs/spec.md` (§7 content model, §8 engine).

## Global Constraints

- Every colour in generated SVG is a `var(--…)` token or a `color-mix()` of tokens. No hex, `rgb()` or `hsl()` literals. The existing test in `tests/unit/render.test.ts` enforces this.
- The public `renderScene(scene, opts)` signature and output contract stay unchanged:
  - `<svg class="iso-scene">` with `DEFS`, then `.iso-entities`, `.iso-links`, and an empty `.iso-packets`.
  - Entity groups keep `class="iso-entity kind-<kind> tone-<tone>[ is-hidden][ is-highlighted]" data-id`.
  - Link groups keep `data-from`, `data-to` and `data-x1..y2`.
  - Labels keep `.iso-label` pills.
- Every shaded face of a figure carries `class="iso-face"`, so the existing highlight and dash CSS in `engine.css` applies to it.
- No-JS static render and a11y attributes (`role="img"`, `aria-label`, `aria-describedby`) are unchanged.
- Docs diagrams are UML in Mermaid. Docs follow the language of the doc they extend: `spec.md` and ADRs are in Spanish.
- Branch `feature/figures-lab`. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verification commands, run from `web/`: `pnpm test`, `pnpm check`, `pnpm build`, `pnpm test:e2e`.

## Review Focus

1. **An interface with zero `implements` links** (a lesson step can show it before any implementation exists). It must render a socket with 0 slots and no `NaN` in the markup. Pinned in Task 2.
2. **Labels on figures taller than the entity's `size.h`** (voxel, cartridge). The label pill must sit fully above the figure's top. Pinned in Task 3.
3. **A highlighted new figure.** The highlight stroke must reach its faces, which it only does if the faces carry `iso-face`. Pinned in Task 2.
4. **Entities sized differently from the Strategy lesson**: the demo fixture uses 1.5 × 1.5 blocks. Figures scale from `size` instead of assuming 1 × 1. Pinned in Task 2.
5. **Blueprint theme.** Icons and details must stay visible on the dark background, so only tokens can be used. Pinned in Task 5 (e2e on both themes) and by the no-literal-colour test.

---

### Task 1: Icons and face decals

**Files:**
- Create: `web/src/engine/icons.ts`
- Test: `web/tests/unit/icons.test.ts`

**Interfaces:**
- Produces:
  - `ICON_NAMES = ['gear','arrow-in','calendar','ten','ticket','cap','key','warning','leaf'] as const`
  - `type IconName = (typeof ICON_NAMES)[number]`
  - `isIconName(v: unknown): v is IconName`
  - `iconMarkup(name: IconName): string`. An SVG fragment drawn in the unit square 0..1. Strokes use `vector-effect:non-scaling-stroke`, and colours are tokens only.
  - `type Face = 'top' | 'left' | 'right'`
  - `type Box3 = { x: number; y: number; z: number; w: number; d: number; h: number }`
  - `faceMatrix(face: Face, b: Box3): string`. Returns `matrix(a b c d e f)`, mapping the unit square onto that face of the box. Face conventions match `render.ts`:
    - `left` is the `y+d` side, with the origin at its top-left corner `(x, y+d, z+h)`. u runs along +x and v runs down to z.
    - `right` is the `x+w` side, with the origin at `(x+w, y+d, z+h)`. u runs toward `(x+w, y, z+h)` and v runs down.
    - `top` has its origin at `(x, y, z+h)`. u runs along +x and v along +y.
  - `decal(face: Face, b: Box3, body: string, cls?: string): string`. Returns `<g class="fig-decal[ cls]" transform="…">body</g>`.

- [ ] **Step 1: Write the failing tests**

```ts
import { ICON_NAMES, decal, faceMatrix, iconMarkup, isIconName } from '../../src/engine/icons';
import { project } from '../../src/engine/iso';

const apply = (m: string, u: number, v: number) => {
  const [a, b, c, d, e, f] = m.match(/matrix\(([^)]+)\)/)![1].split(' ').map(Number);
  return { sx: a * u + c * v + e, sy: b * u + d * v + f };
};
const box = { x: 1, y: 2, z: 0.25, w: 1, d: 1, h: 0.6 };

test('every icon renders token-only markup', () => {
  for (const name of ICON_NAMES) {
    const svg = iconMarkup(name);
    expect(svg.length).toBeGreaterThan(20);
    expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(|NaN/i);
  }
});
test('isIconName accepts the catalogue only', () => {
  expect(isIconName('gear')).toBe(true);
  expect(isIconName('rocket')).toBe(false);
  expect(isIconName(3)).toBe(false);
});
test.each([
  ['top', [0, 0], { x: 1, y: 2, z: 0.85 }], ['top', [1, 1], { x: 2, y: 3, z: 0.85 }],
  ['left', [0, 0], { x: 1, y: 3, z: 0.85 }], ['left', [1, 1], { x: 2, y: 3, z: 0.25 }],
  ['right', [0, 0], { x: 2, y: 3, z: 0.85 }], ['right', [1, 1], { x: 2, y: 2, z: 0.25 }],
] as const)('faceMatrix %s maps unit corner %j onto the box', (face, [u, v], p) => {
  const got = apply(faceMatrix(face, box), u, v);
  const want = project(p);
  expect(got.sx).toBeCloseTo(want.sx, 1);
  expect(got.sy).toBeCloseTo(want.sy, 1);
});
test('decal wraps the body in a transformed fig-decal group', () => {
  expect(decal('top', box, '<circle/>', 'fig-icon')).toMatch(/^<g class="fig-decal fig-icon" transform="matrix\([^"]+\)"><circle\/><\/g>$/);
});
```

- [ ] **Step 2: Run them and check they fail.** Run `pnpm test tests/unit/icons.test.ts`. Expected: FAIL, because the module does not exist.
- [ ] **Step 3: Implement `web/src/engine/icons.ts`.** Port the icon shapes from `web/src/lab/skins.ts` (`ICON.gear`, `arrowIn`, `calendar`, `ten`, `ticket`, `cap`, `key`, `warning`, `leaf`) and its `faceMatrix`/`decal`. Keep them token-only, and round numbers to 2 decimals as `render.ts` does.
- [ ] **Step 4: Run them and check they pass.** Run `pnpm test tests/unit/icons.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(engine): icon catalogue and face decals`.

---

### Task 2: Figures

**Files:**
- Create: `web/src/engine/figures.ts`
- Modify: `web/src/engine/types.ts` (add `icon?: IconName` to `Entity`, imported as a type from `./icons`)
- Test: `web/tests/unit/figures.test.ts`

**Interfaces:**
- Consumes: Task 1 (`iconMarkup`, `decal`, `Box3`), plus `project`/`TILE_W` from `iso.ts`.
- Produces:
  - `type FigureShape = 'voxel' | 'platform' | 'socket' | 'cartridge' | 'block'`
  - `type FigureCtx = { slots: number; isImplementation: boolean }`
  - `figureCtx(e: Entity, links: Link[]): FigureCtx`:
    - `slots` is the number of `implements` links whose `to === e.id`.
    - `isImplementation` is true when some `implements` link has `from === e.id`.
  - `figureShape(e: Entity, ctx: FigureCtx): FigureShape`:
    - an actor is `voxel`;
    - a container is `platform`;
    - an interface is `socket`;
    - a block with `isImplementation` is `cartridge`;
    - any other block is `block`.
  - `figureBox(e: Entity, ctx: FigureCtx): Box3`. The solid the figure occupies, centred on the entity footprint, in iso units:
    - `block`: the entity's own box;
    - `platform`: the entity's own box;
    - `cartridge`: w = 0.7·size.w, d = 0.45·size.d, h = 0.8·max(size.w, size.d);
    - `socket`: w = size.w, d = 0.7·size.d, h = min(size.h, 0.35);
    - `voxel`: w = 0.5·size.w, d = 0.3·size.d, h = 1.25·max(size.w, size.d).
  - `figureMarkup(e: Entity, ctx: FigureCtx): string`. Its root is `<g class="iso-figure figure-<shape>">`. Marker classes inside:
    - `fig-lid` (block lid),
    - `fig-icon` (the icon decal; block and cartridge when `e.icon` is set; socket draws `«i»` on its front instead),
    - `fig-leds` (block),
    - `fig-cables` (block with `tone === 'danger'`),
    - `fig-contacts` (cartridge),
    - one `fig-slot` per slot (socket),
    - `fig-head` (voxel),
    - `fig-badge` (platform leaf).
  - Every shaded polygon, path or ellipse carries `iso-face`. Socket faces get dashed strokes through the existing `.kind-interface .iso-face` CSS.
  - A soft ground shadow (`fig-shadow`, `fill:var(--ink);opacity:.14`) goes under the block, cartridge and voxel figures.

- [ ] **Step 1: Write the failing tests**

```ts
import { figureBox, figureCtx, figureMarkup, figureShape } from '../../src/engine/figures';
import type { Entity, Link } from '../../src/engine/types';

const ent = (p: Partial<Entity> & Pick<Entity, 'id' | 'kind'>): Entity => ({
  label: p.id, pos: { x: 0, y: 0, z: 0.25 }, size: { w: 1, d: 1, h: 0.6 }, tone: 'neutral', ...p,
});
const links: Link[] = [
  { id: 'a', from: 'm', to: 'i', style: 'implements' },
  { id: 'b', from: 't', to: 'i', style: 'implements' },
  { id: 'c', from: 's', to: 'i', style: 'injects' },
];
const dom = (svg: string) => { const g = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); g.innerHTML = svg; return g; };

test('ctx counts implements links only', () => {
  expect(figureCtx(ent({ id: 'i', kind: 'interface' }), links)).toEqual({ slots: 2, isImplementation: false });
  expect(figureCtx(ent({ id: 'm', kind: 'block' }), links)).toEqual({ slots: 0, isImplementation: true });
  expect(figureCtx(ent({ id: 's', kind: 'block' }), links)).toEqual({ slots: 0, isImplementation: false });
});
test.each([
  ['actor', false, 'voxel'], ['container', false, 'platform'], ['interface', false, 'socket'],
  ['block', true, 'cartridge'], ['block', false, 'block'],
] as const)('%s (impl=%s) → %s', (kind, isImplementation, shape) => {
  expect(figureShape(ent({ id: 'x', kind }), { slots: 0, isImplementation })).toBe(shape);
});
test('block: lid, icon decal, leds; cables only when danger', () => {
  const g = dom(figureMarkup(ent({ id: 's', kind: 'block', icon: 'gear' }), { slots: 0, isImplementation: false }));
  for (const c of ['figure-block', 'fig-lid', 'fig-icon', 'fig-leds']) expect(g.querySelector(`.${c}`)).not.toBeNull();
  expect(g.querySelector('.fig-cables')).toBeNull();
  const bad = dom(figureMarkup(ent({ id: 'l', kind: 'block', tone: 'danger' }), { slots: 0, isImplementation: false }));
  expect(bad.querySelector('.fig-cables')).not.toBeNull();
  expect(bad.querySelector('.fig-icon')).toBeNull();
});
test('cartridge has contacts and its icon', () => {
  const g = dom(figureMarkup(ent({ id: 'm', kind: 'block', icon: 'calendar' }), { slots: 0, isImplementation: true }));
  expect(g.querySelector('.figure-cartridge .fig-contacts')).not.toBeNull();
  expect(g.querySelector('.fig-icon')).not.toBeNull();
});
test.each([0, 1, 4])('socket draws %i slots and no NaN', (slots) => {
  const svg = figureMarkup(ent({ id: 'i', kind: 'interface' }), { slots, isImplementation: false });
  expect(dom(svg).querySelectorAll('.fig-slot')).toHaveLength(slots);
  expect(svg).not.toContain('NaN');
});
test('voxel has a head; platform has the leaf badge', () => {
  expect(dom(figureMarkup(ent({ id: 'a', kind: 'actor' }), { slots: 0, isImplementation: false })).querySelector('.fig-head')).not.toBeNull();
  expect(dom(figureMarkup(ent({ id: 'c', kind: 'container', size: { w: 6, d: 5, h: 0.25 } }), { slots: 0, isImplementation: false })).querySelector('.fig-badge')).not.toBeNull();
});
test('shaded faces carry iso-face so highlight CSS reaches them', () => {
  for (const kind of ['actor', 'container', 'interface', 'block'] as const) {
    const g = dom(figureMarkup(ent({ id: 'x', kind, icon: kind === 'block' ? 'gear' : undefined }), { slots: 2, isImplementation: false }));
    expect(g.querySelectorAll('.iso-face').length).toBeGreaterThanOrEqual(3);
  }
});
test('cartridge box scales from size and stays centred (1.5 x 1.5 fixture block)', () => {
  const e = ent({ id: 't', kind: 'block', pos: { x: 4.5, y: 4, z: 0.25 }, size: { w: 1.5, d: 1.5, h: 0.75 } });
  const b = figureBox(e, { slots: 0, isImplementation: true });
  expect(b.w).toBeCloseTo(1.05); expect(b.d).toBeCloseTo(0.675); expect(b.h).toBeCloseTo(1.2);
  expect(b.x + b.w / 2).toBeCloseTo(5.25); expect(b.y + b.d / 2).toBeCloseTo(4.75); expect(b.z).toBe(0.25);
});
test('no literal colours in any figure', () => {
  for (const kind of ['actor', 'container', 'interface', 'block'] as const) {
    expect(figureMarkup(ent({ id: 'x', kind, tone: 'danger' }), { slots: 3, isImplementation: false })).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(/i);
  }
});
```

- [ ] **Step 2: Run them and check they fail.** Run `pnpm test tests/unit/figures.test.ts`. Expected: FAIL, because the module does not exist.
- [ ] **Step 3: Implement `figures.ts` and add `icon?: IconName` to `Entity`.**
  - Port from the spike: `prism`, `shadow`, `techBlock` (now `block`), `cartridge`, `socketBoard` (now `socket`, with a slot count), `voxelAthlete` (the non-flexing one, now `voxel`) and `platform` (no checker).
  - The block lid is inset by 0.08 on each side and 0.06 high. The cartridge's icon goes on its left (front) face, with contacts at the bottom of the same face.
  - Fixed values of the spike, such as the 0.86 shrink, give way to the `figureBox` rules above.
- [ ] **Step 4: Run them and check they pass.** Run `pnpm test tests/unit/figures.test.ts && pnpm check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** with `feat(engine): Taller figures (block, cartridge, socket, voxel, platform)`.

---

### Task 3: Wire figures into the renderer

**Files:**
- Modify: `web/src/engine/render.ts` (`entityMarkup`, `labelAnchor`, `rimT`, `topCenter` usage for links, viewBox bounds; delete `prismMarkup`, `actorMarkup`, `actorRadii` once unused)
- Modify: `web/src/engine/iso.ts` only if a helper is better placed there
- Test: `web/tests/unit/render.test.ts`

**Interfaces:**
- Consumes: Task 2 (`figureCtx`, `figureShape`, `figureBox`, `figureMarkup`).
- Produces: `renderScene` with an unchanged signature. Changes in the output:
  - The entity group contains the figure markup followed by the label.
  - The **link anchor** of an entity is the projected centre of the top face of its `figureBox`. Blocks keep `size.h`, so the existing endpoint test still holds.
  - The **rim** used to shorten links is the top face of its `figureBox`, for every shape.
  - The **label** pill sits `6px` above the highest projected point of the figure. That is the back corner of the `figureBox` top face, or for `voxel` the top of the head.
  - The **viewBox** grows to include every `figureBox` corner, the voxel head and every label, plus `MARGIN`.

- [ ] **Step 1: Write the failing tests** (add them to `render.test.ts`; keep every existing test)

```ts
test('entities render their Taller figure inside the entity group', () => {
  const svg = renderScene(scene); // fixture: ctx container, client actor, service block, strategy interface, tenpack implements strategy
  const root = document.createElement('div'); root.innerHTML = svg;
  const shape = (id: string) => root.querySelector(`.iso-entity[data-id="${id}"] .iso-figure`)!.getAttribute('class');
  expect(shape('ctx')).toContain('figure-platform');
  expect(shape('client')).toContain('figure-voxel');
  expect(shape('strategy')).toContain('figure-socket');
  expect(shape('tenpack')).toContain('figure-cartridge');
  expect(shape('service')).toContain('figure-block');
  expect(root.querySelectorAll('.iso-entity[data-id="strategy"] .fig-slot')).toHaveLength(1);
  expect(svg).not.toContain('NaN');
});
test('label pills sit above the top of taller figures', () => {
  const root = document.createElement('div'); root.innerHTML = renderScene(scene);
  for (const id of ['client', 'tenpack']) {
    const g = root.querySelector(`.iso-entity[data-id="${id}"]`)!;
    const labelY = Number(g.querySelector('.iso-label')!.getAttribute('transform')!.match(/translate\([^ ]+ ([^)]+)\)/)![1]);
    const pts = [...g.querySelector('.iso-figure')!.innerHTML.matchAll(/(?:points="|[ML ,])(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(m => Number(m[2]));
    expect(labelY + 10).toBeLessThanOrEqual(Math.min(...pts)); // PILL_H/2 = 10
  }
});
```

- [ ] **Step 2: Run them and check they fail.** Run `pnpm test tests/unit/render.test.ts`. Expected: the new tests FAIL; the existing ones pass.
- [ ] **Step 3: Implement the wiring in `render.ts`.**
  - Compute `ctx` once per entity from `scene.links`.
  - `entityMarkup(e, ctx, step)` emits the same outer `<g class="iso-entity …">` and replaces the shape with `figureMarkup(e, ctx)`.
  - Replace `topFace(e)`, `topCenter(e)` and `actorRadii` usages with `figureBox`-based helpers.
  - The `iso.ts` `topCenter` export stays, because the player and the tests may use it.
- [ ] **Step 4: Run all unit tests.** Run `pnpm test && pnpm check`. Expected: all PASS, including `static snapshot matches what the player applies for every step` and the no-literal-colour test.
- [ ] **Step 5: Run the e2e suite.** Run `pnpm build && pnpm test:e2e`. Expected: 23/23 PASS. Packets travel between the new link anchors.
- [ ] **Step 6: Commit** with `feat(engine): render entities with Taller figures`.

---

### Task 4: Icons in content and validation

**Files:**
- Modify: `web/src/lib/validate.ts` (in `validateLesson`)
- Modify: `web/src/content/lessons/strategy/scene.ts`, `web/src/content/lessons/__fixtures__/demo/scene.ts`
- Test: `web/tests/unit/validate.test.ts`

**Interfaces:**
- Consumes: Task 1 `isIconName`.
- Produces: two validator error messages, both exact strings:
  - `` `${sceneFile}: entity "${id}" has unknown icon "${icon}"` ``
  - `` `${sceneFile}: entity "${id}" (${kind}) cannot have an icon` `` for `actor` and `container`

- [ ] **Step 1: Write the failing tests.** Add them to `validate.test.ts`, following its existing helpers for building a valid lesson:

```ts
test('rejects unknown icons', () => {
  const errs = validateWithEntityPatch('service', { icon: 'rocket' as never });
  expect(errs).toContain('demo/scene.ts: entity "service" has unknown icon "rocket"');
});
test('rejects icons on actors and containers', () => {
  expect(validateWithEntityPatch('client', { icon: 'gear' })).toContain('demo/scene.ts: entity "client" (actor) cannot have an icon');
  expect(validateWithEntityPatch('ctx', { icon: 'leaf' })).toContain('demo/scene.ts: entity "ctx" (container) cannot have an icon');
});
test('accepts known icons on blocks and interfaces', () => {
  expect(validateWithEntityPatch('service', { icon: 'gear' })).toEqual([]);
});
```

`validateWithEntityPatch(id, patch)` is a small local helper. It clones the existing valid fixture lesson used in this file, merges `patch` into the named entity and returns `validateLesson(...)`. Adapt the slug and file prefix to the ones the file already uses.

- [ ] **Step 2: Run them and check they fail.** Run `pnpm test tests/unit/validate.test.ts`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement both checks in `validateLesson`.**
- [ ] **Step 4: Set the icons in the content.**
  - In `strategy/scene.ts`:

    | Entity | Icon |
    |---|---|
    | controller | `arrow-in` |
    | service | `gear` |
    | legacy | `warning` |
    | monthly | `calendar` |
    | tenpack | `ten` |
    | dropin | `ticket` |
    | student | `cap` |
    | encoder | `key` |

  - In the demo fixture: service is `gear` and tenpack is `ten`.
- [ ] **Step 5: Run the full checks.** Run `pnpm test && pnpm check && pnpm build`. Expected: all PASS, and the build reports no validation errors.
- [ ] **Step 6: Visual check.** Run `pnpm preview` and open `/es/patterns/strategy/` in both themes (`?theme=paper`, `?theme=blueprint`), stepping through all 9 steps. Check four things:
  - labels don't overlap figures;
  - arrows end at the figure rims;
  - packets travel along their links;
  - the highlight is visible on the new figures.

  Adjust positions in `scene.ts` only if an overlap appears, and keep the layout notes comment accurate.
- [ ] **Step 7: Commit** with `feat(content): icons for the Strategy lesson; validate entity icons`.

---

### Task 5: Living gallery at /lab/figuras/

**Files:**
- Modify: `web/src/pages/lab/figuras.astro` (rewrite on the real engine)
- Delete: `web/src/lab/skins.ts`
- Create: `web/tests/e2e/lab.spec.ts`
- Modify: `web/playwright.config.ts` (add `lab.spec.ts` to the desktop project's `testMatch`)
- Keep: the sitemap filter for `/lab/` in `web/astro.config.mjs`, and `.playwright-mcp/` in `.gitignore`

**Interfaces:**
- Consumes: `renderScene` (Task 3), `ICON_NAMES` and `iconMarkup` (Task 1), the Strategy `scene`.
- Produces: a page with the following sections and controls:
  - **(a)** Theme buttons Papel/Blueprint (`data-theme-set`).
  - **(b)** The Strategy scene through `renderScene` with step buttons (`data-step`). These reuse the existing inline class-toggling script.
  - **(c)** A **figures** grid, `[data-gallery="figures"]`, with one cell per shape × tone. The five shapes are block, cartridge, socket with 3 slots, voxel and platform; the four tones are neutral, accent, warn and danger. Each cell is a one-entity `renderScene`; give the socket and cartridge cells the links their shape needs.
  - **(d)** An **icons** grid, `[data-gallery="icons"]`, with one block per icon in `ICON_NAMES`, labelled with the icon name.
  - It keeps `<meta name="robots" content="noindex, nofollow">` and Spanish copy.

- [ ] **Step 1: Write the failing e2e test**

```ts
import { expect, test } from '@playwright/test';

for (const theme of ['paper', 'blueprint'] as const) {
  test(`lab gallery renders on ${theme} without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });
    await page.goto(`/lab/figuras/?theme=${theme}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('[data-gallery="icons"] .iso-entity')).toHaveCount(9);
    await expect(page.locator('[data-gallery="figures"] .figure-socket').first()).toBeVisible();
    await expect(page.locator('.stage .iso-entity[data-id="iface"] .fig-slot')).toHaveCount(4);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    expect(errors).toEqual([]);
  });
}
test('step buttons toggle the scene', async ({ page }) => {
  await page.goto('/lab/figuras/');
  await page.getByRole('button', { name: /spring-does-it/ }).click();
  await expect(page.locator('.stage .iso-entity[data-id="encoder"]')).not.toHaveClass(/is-hidden/);
  await expect(page.locator('.stage .iso-entity[data-id="service"]')).toHaveClass(/is-hidden/);
});
```

- [ ] **Step 2: Run it and check it fails.** Run `pnpm build && pnpm test:e2e tests/e2e/lab.spec.ts`. Expected: FAIL, because the `data-gallery` grids do not exist yet.
- [ ] **Step 3: Rewrite the page and delete `src/lab/skins.ts`.**
- [ ] **Step 4: Run everything.** Run `pnpm test && pnpm check && pnpm build && pnpm test:e2e`. Expected: all PASS. The e2e count is 23 existing tests plus 3 new.
- [ ] **Step 5: Commit** with `feat(lab): living figure and icon gallery on the real engine`.

---

### Task 6: ADR and spec update

**Files:**
- Create: `docs/adr/0001-figuras-taller.md` (Spanish)
- Modify: `docs/spec.md`:
  - §7 content-model class diagram: `Entity` gains `+icon?: IconName`;
  - §8.2 primitives: describe the five figures and how they are selected;
  - §12 decision log: new row `D14`.

**Interfaces:**
- Consumes: the design doc and the final code.

- [ ] **Step 1: Write the ADR.** Use the sections Contexto, Decisión, Alternativas, Consecuencias. Include:
  - the `classDiagram` (Entity → IconName; Figure implementations; Decal → Icons);
  - the selection `flowchart` from the design doc, translated;
  - a link to `/lab/figuras/` as the visual reference.
- [ ] **Step 2: Update `spec.md`** §7, §8.2 and §12 as listed above. D14 reads: "Figuras «Taller»: la forma se deriva de `kind` y de los enlaces `implements`; las lecciones solo eligen `icon`."
- [ ] **Step 3: Check the Mermaid blocks are well-formed.** Every block opens with ```` ```mermaid ```` and closes, and `grep -c '```mermaid' docs/adr/0001-figuras-taller.md` is ≥ 2.
- [ ] **Step 4: Commit** with `docs: ADR 0001 Taller figures; spec §7/§8.2/§12`.
