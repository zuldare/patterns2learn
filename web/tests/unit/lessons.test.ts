import { listLessons, loadLesson } from '../../src/lib/lessons';

test('listLessons returns the real lessons and never the fixtures', async () => {
  const slugs = (await listLessons()).map((l) => l.slug);
  expect([...slugs].sort()).toEqual(['proxy', 'singleton', 'strategy', 'template-method']);
});

test('loadLesson rejects unknown slug', async () => {
  await expect(loadLesson('nope')).rejects.toThrow(/not found/);
});

test('es and en quizzes are in parity and answers are not all in one position', async () => {
  for (const lesson of await listLessons()) {
    const { es, en } = lesson.texts;
    expect(es.quiz.map((q) => [q.options.length, q.answer])).toEqual(en.quiz.map((q) => [q.options.length, q.answer]));
    const answers = es.quiz.map((q) => q.answer);
    const most = Math.max(...answers.map((a) => answers.filter((b) => b === a).length));
    expect(most, `${lesson.slug} answers ${answers}`).toBeLessThanOrEqual(Math.ceil(answers.length / 2));
  }
});
