import { CATALOG, catalogGroups } from '../../src/lib/catalog';
import { listLessons } from '../../src/lib/lessons';

test('catalog holds the 23 GoF patterns: 5 creational, 7 structural, 11 behavioral', () => {
  expect(CATALOG).toHaveLength(23);
  const count = (c: string) => CATALOG.filter((p) => p.category === c).length;
  expect([count('creational'), count('structural'), count('behavioral')]).toEqual([5, 7, 11]);
  expect(new Set(CATALOG.map((p) => p.slug)).size).toBe(23);
});

test('every real lesson is in the catalog under the same category', async () => {
  for (const lesson of await listLessons()) {
    const entry = CATALOG.find((p) => p.slug === lesson.slug);
    expect(entry, lesson.slug).toBeDefined();
    expect(entry?.category, lesson.slug).toBe(lesson.category);
  }
});

test('catalogGroups pairs entries with lessons and keeps unknown lessons', async () => {
  const lessons = await listLessons();
  const groups = catalogGroups(lessons);
  expect(groups.map((g) => g.cat)).toEqual(['creational', 'structural', 'behavioral']);
  const items = groups.flatMap((g) => g.items);
  expect(items).toHaveLength(23);
  expect(items.filter((i) => i.lesson)).toHaveLength(lessons.length);
  const extra = { ...lessons[0], slug: 'ioc', category: 'spring' as const };
  const withSpring = catalogGroups([...lessons, extra]);
  expect(withSpring[0].cat).toBe('spring');
  expect(withSpring[0].items.map((i) => i.slug)).toEqual(['ioc']);
});
