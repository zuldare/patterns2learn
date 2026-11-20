/**
 * The pattern's structure as a Mermaid UML class diagram, one `structure.mmd` per lesson folder.
 * Classes are the example's own; each carries its GoF role as a stereotype (`<<AbstractFactory>>`).
 */
const sources = import.meta.glob<string>('../content/lessons/*/structure.mmd', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const bySlug = new Map(
  Object.entries(sources).map(([path, raw]) => [path.replace(/^.*\/lessons\//, '').replace(/\/structure\.mmd$/, ''), raw.trim()]),
);

export function structureOf(slug: string): string | undefined {
  return bySlug.get(slug);
}

export function structureSlugs(): string[] {
  return [...bySlug.keys()].filter(s => !s.startsWith('__'));
}
