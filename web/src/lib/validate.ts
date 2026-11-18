import type { Locale, LessonText, Scene } from '../engine/types';
import type { Snippet } from './snippets';

export function validateLesson(
  slug: string,
  scene: Scene,
  texts: Record<Locale, LessonText>,
  snippets: Map<string, Snippet>,
): string[] {
  const errors: string[] = [];
  const sceneFile = `${slug}/scene.ts`;
  const entityIds = new Set(scene.entities.map((e) => e.id));
  const linkIds = new Set(scene.links.map((l) => l.id));

  // Rule 4: step count
  if (scene.steps.length < 6 || scene.steps.length > 10) {
    errors.push(`${sceneFile}: ${scene.steps.length} steps (allowed 6..10)`);
  }

  // Rule 2: references
  for (const link of scene.links) {
    for (const end of [link.from, link.to]) {
      if (!entityIds.has(end)) {
        errors.push(`${sceneFile}: link "${link.id}" references unknown entity "${end}"`);
      }
    }
  }
  for (const step of scene.steps) {
    for (const id of [...step.visible, ...step.highlight]) {
      if (!entityIds.has(id)) {
        errors.push(`${sceneFile}: step "${step.id}" references unknown entity "${id}"`);
      }
    }
    for (const p of step.packets) {
      if (!linkIds.has(p.link)) {
        errors.push(`${sceneFile}: step "${step.id}" references unknown link "${p.link}"`);
      }
    }
    // Rule 3: snippet highlight lines
    if (step.code) {
      const key = `${step.code.file}#${step.code.region}`;
      const snip = snippets.get(key);
      if (!snip) {
        errors.push(`${sceneFile}: step "${step.id}" snippet "${key}" not loaded`);
      } else {
        for (const line of step.code.highlight) {
          if (line < 1 || line > snip.lineCount) {
            errors.push(
              `${sceneFile}: step "${step.id}" highlight line ${line} outside snippet "${key}" (1..${snip.lineCount})`,
            );
          }
        }
      }
    }
  }

  // Rules 1, 4, 5: texts
  const sceneIds = scene.steps.map((s) => s.id);
  for (const locale of ['es', 'en'] as const) {
    const file = `${slug}/${locale}.md`;
    const text = texts[locale];
    const textIds = text.steps.map((s) => s.id);

    let structural = false;
    sceneIds.forEach((id, i) => {
      if (!textIds.includes(id)) {
        structural = true;
        const prev = i > 0 ? `after "${sceneIds[i - 1]}"` : 'as first step';
        errors.push(`${file}: step "${id}" missing (expected ${prev})`);
      }
    });
    for (const id of textIds) {
      if (!sceneIds.includes(id)) {
        structural = true;
        errors.push(`${file}: step "${id}" not in scene`);
      }
    }
    if (!structural && textIds.join(',') !== sceneIds.join(',')) {
      errors.push(
        `${file}: step order differs from scene (expected ${sceneIds.join(', ')}; found ${textIds.join(', ')})`,
      );
    }

    for (const s of text.steps) {
      if (!s.describe || s.describe.trim() === '') {
        errors.push(`${file}: step "${s.id}" has no @describe`);
      }
    }

    if (text.quiz.length < 3 || text.quiz.length > 5) {
      errors.push(`${file}: ${text.quiz.length} quiz questions (allowed 3..5)`);
    }
    text.quiz.forEach((q, i) => {
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
        errors.push(`${file}: quiz question ${i + 1} answer ${q.answer} out of range`);
      }
    });
  }

  return errors;
}
