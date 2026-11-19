import type { Category, Lesson } from '../engine/types';

export interface CatalogEntry {
  slug: string;
  name: string;
  category: Exclude<Category, 'spring'>;
}

/** The 23 GoF patterns (spec §2.1), in book order inside each category. */
export const CATALOG: readonly CatalogEntry[] = [
  ['abstract-factory', 'Abstract Factory', 'creational'],
  ['builder', 'Builder', 'creational'],
  ['factory-method', 'Factory Method', 'creational'],
  ['prototype', 'Prototype', 'creational'],
  ['singleton', 'Singleton', 'creational'],
  ['adapter', 'Adapter', 'structural'],
  ['bridge', 'Bridge', 'structural'],
  ['composite', 'Composite', 'structural'],
  ['decorator', 'Decorator', 'structural'],
  ['facade', 'Facade', 'structural'],
  ['flyweight', 'Flyweight', 'structural'],
  ['proxy', 'Proxy', 'structural'],
  ['chain-of-responsibility', 'Chain of Responsibility', 'behavioral'],
  ['command', 'Command', 'behavioral'],
  ['interpreter', 'Interpreter', 'behavioral'],
  ['iterator', 'Iterator', 'behavioral'],
  ['mediator', 'Mediator', 'behavioral'],
  ['memento', 'Memento', 'behavioral'],
  ['observer', 'Observer', 'behavioral'],
  ['state', 'State', 'behavioral'],
  ['strategy', 'Strategy', 'behavioral'],
  ['template-method', 'Template Method', 'behavioral'],
  ['visitor', 'Visitor', 'behavioral'],
].map(([slug, name, category]) => ({ slug, name, category }) as CatalogEntry);

export interface CatalogItem {
  slug: string;
  name: string;
  /** Present once the lesson exists; absent means "coming soon". */
  lesson?: Lesson;
}

const ORDER: Category[] = ['spring', 'creational', 'structural', 'behavioral'];

/** Course tree groups: every catalog pattern, plus lessons outside the catalog (Spring patterns). */
export function catalogGroups(lessons: Lesson[]): { cat: Category; items: CatalogItem[] }[] {
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const known = new Set(CATALOG.map((p) => p.slug));
  return ORDER.map((cat) => ({
    cat,
    items: [
      ...CATALOG.filter((p) => p.category === cat).map((p) => ({ slug: p.slug, name: p.name, lesson: bySlug.get(p.slug) })),
      ...lessons
        .filter((l) => l.category === cat && !known.has(l.slug))
        .map((l) => ({ slug: l.slug, name: l.slug, lesson: l })),
    ],
  })).filter((g) => g.items.length > 0);
}
