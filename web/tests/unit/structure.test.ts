import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { structureOf } from '../../src/lib/structure';

const lessons = readdirSync(resolve(__dirname, '../../src/content/lessons')).filter(s => !s.startsWith('_'));

describe.each(lessons)('%s structure.mmd', slug => {
  const src = structureOf(slug) ?? '';
  test('exists and is a Mermaid class diagram', () => {
    expect(src.split('\n')[0]).toBe('classDiagram');
  });
  test('every class carries exactly one GoF role stereotype', () => {
    const blocks = [...src.matchAll(/^\s*class (\w+) \{([^}]*)\}/gm)];
    expect(blocks.length).toBeGreaterThan(0);
    for (const [, name, body] of blocks) {
      const roles = body.match(/<<\w+>>/g) ?? [];
      expect(roles, name).toHaveLength(1);
    }
  });
});
