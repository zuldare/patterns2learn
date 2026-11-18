import { validateLesson } from '../../src/lib/validate';
import type { Locale, LessonText, Scene } from '../../src/engine/types';
import type { Snippet } from '../../src/lib/snippets';

function textFor(ids: string[]): LessonText {
  return {
    title: 't',
    summary: 's',
    minutes: 10,
    level: 'beginner',
    steps: ids.map((id) => ({ id, title: id, html: '<p>x</p>', describe: `d ${id}` })),
    recap: { intent: 'i', participants: ['a'], pros: ['p'], cons: ['c'], related: [] },
    quiz: [0, 1, 2].map(() => ({ q: 'q', options: ['a', 'b', 'c'], answer: 1, explain: 'e' })),
  };
}

function fixture(): [Scene, Record<Locale, LessonText>, Map<string, Snippet>] {
  const ids = ['s1', 's2', 's3', 's4', 's5', 's6'];
  const scene: Scene = {
    entities: [
      { id: 'a', kind: 'actor', label: 'A', pos: { x: 0, y: 0 }, size: { w: 1, d: 1, h: 1 }, tone: 'neutral' },
      { id: 'b', kind: 'block', label: 'B', pos: { x: 2, y: 0 }, size: { w: 1, d: 1, h: 1 }, tone: 'accent' },
    ],
    links: [{ id: 'l', from: 'a', to: 'b', style: 'call' }],
    steps: ids.map((id) => ({
      id,
      visible: ['a', 'b'],
      highlight: ['b'],
      packets: [],
      code: { file: 'f.java', region: 'r', highlight: [1, 2] },
    })),
  };
  const snips = new Map<string, Snippet>([
    ['f.java#r', { file: 'f.java', region: 'r', code: 'a\nb\nc', lineCount: 3 }],
  ]);
  return [scene, { es: textFor(ids), en: textFor(ids) }, snips];
}

test('valid fixture has no errors', () => expect(validateLesson('demo', ...fixture())).toEqual([]));
test('en missing a step', () => {
  const [scene, texts, snips] = fixture(); texts.en.steps.splice(2, 1);
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/en.md: step "s3" missing (expected after "s2")');
});
test('steps out of order', () => {
  const [scene, texts, snips] = fixture(); texts.es.steps.reverse();
  expect(validateLesson('demo', scene, texts, snips)[0]).toMatch(/^demo\/es\.md: step order differs from scene/);
});
test('unknown entity in visible', () => {
  const [scene, texts, snips] = fixture(); scene.steps[0].visible.push('ghost');
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/scene.ts: step "s1" references unknown entity "ghost"');
});
test('unknown link in packet', () => {
  const [scene, texts, snips] = fixture(); scene.steps[1].packets.push({ link: 'nope', label: 'x' });
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/scene.ts: step "s2" references unknown link "nope"');
});
test('unknown entity in link endpoint', () => {
  const [scene, texts, snips] = fixture(); scene.links[0].to = 'zzz';
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/scene.ts: link "l" references unknown entity "zzz"');
});
test('highlight outside snippet', () => {
  const [scene, texts, snips] = fixture(); scene.steps[0].code!.highlight = [99];
  expect(validateLesson('demo', scene, texts, snips)[0]).toMatch(/highlight line 99 outside snippet/);
});
test('step count bounds', () => {
  const [scene, texts, snips] = fixture(); scene.steps = scene.steps.slice(0, 5);
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/scene.ts: 5 steps (allowed 6..10)');
});
test('quiz bounds and answer index', () => {
  const [scene, texts, snips] = fixture(); texts.es.quiz[0].answer = 7;
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/es.md: quiz question 1 answer 7 out of range');
});
test('quiz size bounds', () => {
  const [scene, texts, snips] = fixture(); texts.en.quiz = texts.en.quiz.slice(0, 2);
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/en.md: 2 quiz questions (allowed 3..5)');
});
test('empty describe', () => {
  const [scene, texts, snips] = fixture(); texts.en.steps[0].describe = '';
  expect(validateLesson('demo', scene, texts, snips)).toContain('demo/en.md: step "s1" has no @describe');
});
