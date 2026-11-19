import { parseLessonText } from '../../src/lib/lesson-text';

const md = `---
title: Strategy
summary: s
minutes: 12
level: beginner
recap: { intent: i, participants: [a], pros: [p], cons: [c], related: [state] }
quiz:
  - { q: Q1, options: [a, b, c], answer: 1, explain: e }
---
## @step:problem — El problema
Texto **fuerte**.
> [!problem]
> Cuidado.
@describe: Un bloque grande con tres ramas.

## @step:fix — La solución
Otro texto.
@describe: Tres bloques.
`;

test('parses steps, describe and callouts', () => {
  const t = parseLessonText(md, 'x/es.md');
  expect(t.steps.map((s) => s.id)).toEqual(['problem', 'fix']);
  expect(t.steps[0].title).toBe('El problema');
  expect(t.steps[0].describe).toBe('Un bloque grande con tres ramas.');
  expect(t.steps[0].html).toContain('<strong>fuerte</strong>');
  expect(t.steps[0].html).toContain('callout--problem');
  expect(t.steps[0].html).not.toContain('@describe');
  expect(t.quiz[0].answer).toBe(1);
});

test('step without describe yields empty string', () => {
  const t = parseLessonText(md.replace('@describe: Tres bloques.', ''), 'x/es.md');
  expect(t.steps[1].describe).toBe('');
});

test('missing frontmatter throws with file name', () => {
  expect(() => parseLessonText('## @step:a — A\nx', 'x/es.md')).toThrow(/x\/es\.md/);
});

describe('frontmatter validation', () => {
  const withFm = (fm: string) => `---\n${fm}\n---\n## @step:a — A\nx\n`;
  const valid = [
    'title: T',
    'summary: S',
    'minutes: 12',
    'level: beginner',
    'recap: { intent: i, participants: [a], pros: [p], cons: [c], related: [] }',
    'quiz:',
    '  - { q: Q, options: [a, b], answer: 0, explain: e }',
  ];
  const without = (key: string) => withFm(valid.filter((l) => !l.startsWith(key) && !(key === 'quiz' && l.startsWith('  -'))).join('\n'));

  test('a complete frontmatter parses', () => {
    expect(() => parseLessonText(withFm(valid.join('\n')), 'x/en.md')).not.toThrow();
  });

  test.each(['title', 'summary', 'minutes', 'level', 'recap', 'quiz'])('missing %s is reported by name', (key) => {
    expect(() => parseLessonText(without(key), 'x/en.md')).toThrow(new RegExp(`x/en\\.md: frontmatter "${key}"`));
  });

  test('wrong types and recap/quiz shapes get clear messages, all at once', () => {
    const fm = [
      'title: ""',
      'summary: S',
      'minutes: soon',
      'level: expert',
      'recap: { intent: i, participants: a, pros: [p] }',
      'quiz:',
      '  - { q: Q, options: [a], explain: e }',
      '  - just text',
    ].join('\n');
    let message = '';
    try {
      parseLessonText(withFm(fm), 'x/es.md');
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).not.toMatch(/TypeError|Cannot read/);
    for (const part of [
      'frontmatter "title" must be a non-empty string',
      'frontmatter "minutes" must be a positive number',
      'frontmatter "level" must be one of beginner, intermediate, advanced',
      'frontmatter "recap.participants" must be a list of strings',
      'frontmatter "recap.cons" must be a list of strings',
      'frontmatter "recap.related" must be a list of strings',
      'frontmatter "quiz[1].answer" must be an integer',
      'frontmatter "quiz[2]" must be an object with q, options, answer, explain',
    ]) {
      expect(message).toContain(part);
    }
  });
});
