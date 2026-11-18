import { resolve } from 'node:path';
import type {
  Category,
  Lesson,
  LessonText,
  Locale,
  ResolvedStep,
  Scene,
} from '../engine/types';
import { loadSnippet, type Snippet } from './snippets';
import { parseLessonText } from './lesson-text';
import { validateLesson } from './validate';

export class LessonValidationError extends Error {
  errors: string[];

  constructor(slug: string, errors: string[]) {
    super(`Lesson "${slug}" is invalid:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    this.name = 'LessonValidationError';
    this.errors = errors;
  }
}

type SceneModule = { default: Scene; category: Category };

const examplesRoot = resolve(process.cwd(), '../examples') // cwd is web/ under vitest and astro build;

const scenes = import.meta.glob<SceneModule>('../content/lessons/*/scene.ts', { eager: true });
const texts = import.meta.glob<string>('../content/lessons/*/{es,en}.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const fixtureScenes = import.meta.glob<SceneModule>('../content/lessons/__fixtures__/*/scene.ts', {
  eager: true,
});
const fixtureTexts = import.meta.glob<string>('../content/lessons/__fixtures__/*/{es,en}.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function sources() {
  const useFixtures = process.env.P2L_FIXTURES === '1';
  const sceneMap = new Map<string, SceneModule>();
  const textMap = new Map<string, string>();
  const add = (
    s: Record<string, SceneModule>,
    t: Record<string, string>,
    prefix: RegExp,
  ) => {
    for (const [path, mod] of Object.entries(s)) {
      sceneMap.set(path.replace(prefix, '').replace(/\/scene\.ts$/, ''), mod);
    }
    for (const [path, raw] of Object.entries(t)) {
      textMap.set(path.replace(prefix, '').replace(/\.md$/, ''), raw);
    }
  };
  // Defensive: never expose `__`-prefixed directories (fixtures) through the main globs.
  const visible = (o: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(o).filter(([p]) => !/\/lessons\/__/.test(p)),
    );
  add(
    visible(scenes) as Record<string, SceneModule>,
    visible(texts) as Record<string, string>,
    /^\.\.\/content\/lessons\//,
  );
  if (useFixtures) {
    add(fixtureScenes, fixtureTexts, /^\.\.\/content\/lessons\/__fixtures__\//);
  }
  return { sceneMap, textMap };
}

export async function loadLesson(slug: string): Promise<Lesson> {
  const { sceneMap, textMap } = sources();
  const mod = sceneMap.get(slug);
  if (!mod) throw new Error(`Lesson "${slug}" not found`);
  const scene = mod.default;

  const parsed = {} as Record<Locale, LessonText>;
  for (const locale of ['es', 'en'] as const) {
    const raw = textMap.get(`${slug}/${locale}`);
    if (raw === undefined) throw new Error(`${slug}/${locale}.md not found`);
    parsed[locale] = parseLessonText(raw, `${slug}/${locale}.md`);
  }

  const snippets = new Map<string, Snippet>();
  const errors: string[] = [];
  for (const step of scene.steps) {
    if (!step.code) continue;
    const key = `${step.code.file}#${step.code.region}`;
    if (snippets.has(key)) continue;
    try {
      snippets.set(key, loadSnippet(examplesRoot, step.code.file, step.code.region));
    } catch (e) {
      errors.push(`${slug}/scene.ts: step "${step.id}" ${(e as Error).message}`);
    }
  }

  errors.push(...validateLesson(slug, scene, parsed, snippets));
  if (errors.length > 0) throw new LessonValidationError(slug, errors);

  return { slug, category: mod.category, scene, texts: parsed, snippets };
}

export async function listLessons(): Promise<Lesson[]> {
  const { sceneMap } = sources();
  return Promise.all([...sceneMap.keys()].sort().map((slug) => loadLesson(slug)));
}

export function resolveSteps(lesson: Lesson, lang: Locale): ResolvedStep[] {
  const byId = new Map(lesson.texts[lang].steps.map((s) => [s.id, s]));
  return lesson.scene.steps.map((step) => {
    const text = byId.get(step.id);
    if (!text) throw new Error(`${lesson.slug}/${lang}.md: step "${step.id}" missing`);
    const snippet = step.code
      ? lesson.snippets.get(`${step.code.file}#${step.code.region}`)
      : undefined;
    return { ...step, text, snippet };
  });
}
