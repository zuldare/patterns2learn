import { renderScene } from '../../src/engine/render';
import type { Entity, Scene } from '../../src/engine/types';
import { scene } from './fixtures/scene';

const block = (id: string, x: number, y: number): Entity => ({
  id, kind: 'block', label: id.toUpperCase(), pos: { x, y }, size: { w: 1, d: 1, h: 1 }, tone: 'neutral',
});
const miniScene: Scene = {
  entities: [block('mid', 2, 2), block('front', 4, 4), block('back', 0, 0)],
  links: [{ id: 'l1', from: 'back', to: 'front', style: 'call' }],
  steps: [{ id: 's0', visible: ['back', 'mid', 'front'], highlight: [], packets: [] }],
};

test('renders entities in depth order with data-ids and no literal colors', () => {
  const svg = renderScene(miniScene);
  const ids = [...svg.matchAll(/class="iso-entity[^"]*" data-id="([^"]+)"/g)].map(m => m[1]);
  expect(ids).toEqual(['back', 'mid', 'front']);
  expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  expect(svg).toContain('id="path-l1"');
});
test('ties in depth keep declaration order', () => {
  const svg = renderScene({ ...miniScene, entities: [block('b', 1, 0), block('a', 0, 1)] , links: [] });
  const ids = [...svg.matchAll(/class="iso-entity[^"]*" data-id="([^"]+)"/g)].map(m => m[1]);
  expect(ids).toEqual(['b', 'a']);
});
test('svg structure: viewBox, kind/tone classes, link groups, empty packet layer, labels', () => {
  const svg = renderScene(scene);
  expect(svg).toMatch(/^<svg[^>]* viewBox="-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+"/);
  expect(svg).toContain('class="iso-entity kind-container tone-neutral" data-id="ctx"');
  expect(svg).toContain('class="iso-entity kind-block tone-accent" data-id="service"');
  expect(svg).toContain('class="iso-link style-injects" data-id="l-inject"');
  expect(svg).toMatch(/<g class="iso-packets"><\/g>/);
  expect(svg).toContain('>Spring context<');
  expect(svg).not.toMatch(/rgb\(|hsl\(/i);
});
test('viewBox includes a 32px margin around all geometry', () => {
  const svg = renderScene({ ...miniScene, entities: [block('only', 0, 0)], links: [] });
  const [minX, , width] = svg.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number);
  // a 1x1 block spans sx in [-32, 32]; label pill may be wider, never narrower
  expect(minX).toBeLessThanOrEqual(-64);
  expect(width).toBeGreaterThanOrEqual(128);
});
test('link groups store projected endpoint coordinates', () => {
  const root = document.createElement('div');
  root.innerHTML = renderScene(miniScene);
  const g = root.querySelector<SVGGElement>('.iso-link[data-id="l1"]')!;
  // top-face centre of back (0,0,h=1) block → x=0.5,y=0.5,z=1 → sx 0, sy 16-32 = -16
  expect(Number(g.dataset.x1)).toBe(0);
  expect(Number(g.dataset.y1)).toBe(-16);
  expect(Number(g.dataset.x2)).toBe(0);
  expect(Number(g.dataset.y2)).toBe(4.5 * 32 - 32);
});

describe('renderScene at a step', () => {
  const e = (id: string, x: number): Entity => ({
    id, kind: 'block', label: id, pos: { x, y: 0 }, size: { w: 1, d: 1, h: 1 }, tone: 'neutral',
  });
  const two: Scene = {
    entities: [e('a', 0), e('b', 3)],
    links: [{ id: 'l', from: 'a', to: 'b', style: 'call' }],
    steps: [
      { id: 's', visible: ['a'], highlight: [], packets: [] },
      { id: 't', visible: ['a', 'b'], highlight: ['b', 'l'], packets: [] },
    ],
  };

  test('hides entities and links that are not visible in the step', () => {
    const svg = renderScene(two, { step: two.steps[0], label: 'Demo' });
    expect(svg).toMatch(/class="iso-entity is-hidden [^"]*" data-id="b"/);
    expect(svg).not.toMatch(/class="iso-entity is-hidden [^"]*" data-id="a"/);
    expect(svg).toMatch(/class="iso-link is-hidden [^"]*" data-id="l"/);
    expect(svg).toContain('aria-label="Demo"');
  });

  test('marks highlighted entities and links', () => {
    const svg = renderScene(two, { step: two.steps[1] });
    expect(svg).toMatch(/class="iso-entity is-highlighted [^"]*" data-id="b"/);
    expect(svg).toMatch(/class="iso-link is-highlighted [^"]*" data-id="l"/);
    expect(svg).not.toContain('is-hidden');
  });

  test('escapes the accessible label and sets aria-describedby', () => {
    const svg = renderScene(two, { label: 'A "quoted" <b>&</b>', describedBy: 'describe-s' });
    expect(svg).toContain('aria-label="A &quot;quoted&quot; &lt;b&gt;&amp;&lt;/b&gt;"');
    expect(svg).toContain('aria-describedby="describe-s"');
  });

  test('without options the markup is unchanged', () => {
    expect(renderScene(two, {})).toBe(renderScene(two));
    expect(renderScene(two)).not.toMatch(/is-hidden|is-highlighted|aria-label|aria-describedby/);
  });

  test('static snapshot matches what the player applies for every step', async () => {
    const { LessonPlayer } = await import('../../src/engine/player');
    const classes = (root: ParentNode) =>
      [...root.querySelectorAll<SVGGElement>('.iso-entity, .iso-link')].map(
        (g) => `${g.dataset.id}:${g.classList.contains('is-hidden')}:${g.classList.contains('is-highlighted')}`,
      );
    const live = document.createElement('div');
    live.innerHTML = renderScene(scene);
    const player = new LessonPlayer(live, scene, { reducedMotion: true });
    scene.steps.forEach((step, i) => {
      player.goTo(i);
      const fixed = document.createElement('div');
      fixed.innerHTML = renderScene(scene, { step });
      expect(classes(fixed), step.id).toEqual(classes(live));
    });
    player.destroy();
  });
});

test('entities render their Taller figure inside the entity group', () => {
  const svg = renderScene(scene); // fixture: ctx container, client actor, service block, strategy interface, monthly implements strategy
  const root = document.createElement('div');
  root.innerHTML = svg;
  const shape = (id: string) => root.querySelector(`.iso-entity[data-id="${id}"] .iso-figure`)!.getAttribute('class');
  expect(shape('ctx')).toContain('figure-platform');
  expect(shape('client')).toContain('figure-voxel');
  expect(shape('strategy')).toContain('figure-socket');
  expect(shape('monthly')).toContain('figure-cartridge');
  expect(shape('service')).toContain('figure-block');
  expect(root.querySelectorAll('.iso-entity[data-id="strategy"] .fig-slot')).toHaveLength(1);
  expect(svg).not.toContain('NaN');
});
test('label pills sit above the top of taller figures', () => {
  const root = document.createElement('div');
  root.innerHTML = renderScene(scene);
  for (const id of ['client', 'monthly']) {
    const g = root.querySelector(`.iso-entity[data-id="${id}"]`)!;
    const labelY = Number(g.querySelector('.iso-label')!.getAttribute('transform')!.match(/translate\([^ ]+ ([^)]+)\)/)![1]);
    const ys = [...g.querySelector('.iso-figure')!.innerHTML.matchAll(/(?:points="|[ML ])(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(m => Number(m[2]));
    const circles = [...g.querySelectorAll('.iso-figure circle.fig-head')].map(c => Number(c.getAttribute('cy')) - Number(c.getAttribute('r')));
    expect(labelY + 10).toBeLessThanOrEqual(Math.min(...ys, ...circles)); // PILL_H/2 = 10
  }
});
