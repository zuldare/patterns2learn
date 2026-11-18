import { listLessons, loadLesson } from '../../src/lib/lessons';

test('listLessons returns [] when no lessons exist', async () => {
  expect(await listLessons()).toEqual([]);
});

test('loadLesson rejects unknown slug', async () => {
  await expect(loadLesson('nope')).rejects.toThrow(/not found/);
});
