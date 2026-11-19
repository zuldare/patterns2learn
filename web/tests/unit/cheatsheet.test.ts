import { renderSceneAtStep } from '../../src/lib/cheatsheet';
import type { Scene } from '../../src/engine/types';

const e = (id: string, x: number) => ({
  id, kind: 'block' as const, label: id, pos: { x, y: 0 }, size: { w: 1, d: 1, h: 1 }, tone: 'neutral' as const,
});
const scene: Scene = {
  entities: [e('a', 0), e('b', 3)],
  links: [{ id: 'l', from: 'a', to: 'b', style: 'call' }],
  steps: [{ id: 's', visible: ['a'], highlight: [], packets: [] }],
};

test('hides entities and links that are not visible in the step', () => {
  const svg = renderSceneAtStep(scene, scene.steps[0]!, 'Demo');
  expect(svg).toMatch(/class="iso-entity is-hidden [^"]*" data-id="b"/);
  expect(svg).not.toMatch(/class="iso-entity is-hidden [^"]*" data-id="a"/);
  expect(svg).toMatch(/class="iso-link is-hidden [^"]*" data-id="l"/);
  expect(svg).toContain('aria-label="Demo"');
});
