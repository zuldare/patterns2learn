import { escapeXml, renderScene } from '../engine/render';
import type { Scene, SceneStep } from '../engine/types';

/**
 * Static mini diagram: the scene markup with `step`'s visibility baked in via
 * the `is-hidden` class (what the player does at runtime), so it needs no JS.
 */
export function renderSceneAtStep(scene: Scene, step: SceneStep, label: string): string {
  const visible = new Set(step.visible);
  const linkShown = new Map(scene.links.map((l) => [l.id, visible.has(l.from) && visible.has(l.to)]));
  let svg = renderScene(scene);
  svg = svg.replace(/<g class="(iso-entity|iso-link) ([^"]*)" data-id="([^"]*)"/g, (m, cls: string, rest: string, id: string) => {
    const unescaped = id.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    const shown = cls === 'iso-entity' ? visible.has(unescaped) : linkShown.get(unescaped) ?? false;
    return shown ? m : `<g class="${cls} is-hidden ${rest}" data-id="${id}"`;
  });
  return svg.replace('role="img"', `role="img" aria-label="${escapeXml(label)}"`);
}
