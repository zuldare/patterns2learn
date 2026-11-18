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
