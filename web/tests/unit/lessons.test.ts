import { listLessons, loadLesson } from '../../src/lib/lessons';

test('listLessons returns the real lessons and never the fixtures', async () => {
  const slugs = (await listLessons()).map((l) => l.slug);
  expect(slugs).toEqual(['strategy']);
});

test('loadLesson rejects unknown slug', async () => {
  await expect(loadLesson('nope')).rejects.toThrow(/not found/);
});
