import { locales } from '../i18n';
import type { Locale, LessonText, Scene } from '../engine/types';
import type { Snippet } from './snippets';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** Snippet files are relative to examples/: no `..` segments, no absolute or drive paths. */
export function isSafeSnippetPath(file: string): boolean {
  if (file === '' || file.startsWith('/') || file.startsWith('\\') || /^[a-zA-Z]:/.test(file)) return false;
  return !file.split(/[\\/]/).includes('..');
}

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/**
 * Checks the shape of a lesson's YAML frontmatter so a typo yields a clear
 * message (`es.md: frontmatter "recap.pros" must be …`) instead of a TypeError
 * later in the build. Returns every problem found.
 */
export function validateFrontmatter(meta: Record<string, unknown>, file: string): string[] {
  const errors: string[] = [];
  const err = (key: string, msg: string) => errors.push(`${file}: frontmatter "${key}" ${msg}`);
  const missing = (key: string) => err(key, 'is missing');

  for (const key of ['title', 'summary'] as const) {
    if (meta[key] === undefined) missing(key);
    else if (!isText(meta[key])) err(key, 'must be a non-empty string');
  }
  if (meta.minutes === undefined) missing('minutes');
  else if (typeof meta.minutes !== 'number' || !(meta.minutes > 0)) err('minutes', 'must be a positive number');
  if (meta.level === undefined) missing('level');
  else if (!LEVELS.includes(meta.level as string)) err('level', `must be one of ${LEVELS.join(', ')}`);

  if (meta.recap === undefined) missing('recap');
  else if (!isObject(meta.recap)) err('recap', 'must be an object with intent, participants, pros, cons, related');
  else {
    if (!isText(meta.recap.intent)) err('recap.intent', 'must be a non-empty string');
    for (const key of ['participants', 'pros', 'cons', 'related'] as const) {
      if (!isTextList(meta.recap[key])) err(`recap.${key}`, 'must be a list of strings');
    }
  }

  if (meta.quiz === undefined) missing('quiz');
  else if (!Array.isArray(meta.quiz)) err('quiz', 'must be a list of questions');
  else {
    meta.quiz.forEach((q: unknown, i) => {
      const at = `quiz[${i + 1}]`; // 1-based, like "quiz question 1" in validateLesson
      if (!isObject(q)) return err(at, 'must be an object with q, options, answer, explain');
      if (!isText(q.q)) err(`${at}.q`, 'must be a non-empty string');
      if (!isTextList(q.options) || q.options.length < 2) err(`${at}.options`, 'must be a list of at least 2 strings');
      if (!Number.isInteger(q.answer)) err(`${at}.answer`, 'must be an integer');
      if (!isText(q.explain)) err(`${at}.explain`, 'must be a non-empty string');
    });
  }
  return errors;
}

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

  // Unique ids: the player and the DOM address items by id.
  for (const [what, ids] of [
    ['entity', scene.entities.map((e) => e.id)],
    ['link', scene.links.map((l) => l.id)],
    ['step', scene.steps.map((s) => s.id)],
  ] as const) {
    for (const id of duplicates([...ids])) errors.push(`${sceneFile}: duplicate ${what} id "${id}"`);
  }

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
    if (step.code && !isSafeSnippetPath(step.code.file)) {
      errors.push(
        `${sceneFile}: step "${step.id}" snippet file "${step.code.file}" must be a relative path inside examples/ (no "..", not absolute)`,
      );
    } else if (step.code) {
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
  for (const locale of locales) {
    const file = `${slug}/${locale}.md`;
    const text = texts[locale];
    const textIds = text.steps.map((s) => s.id);
    for (const id of duplicates(textIds)) errors.push(`${file}: duplicate step id "${id}"`);

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
