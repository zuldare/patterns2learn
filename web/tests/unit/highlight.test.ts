import { highlightJava } from '../../src/lib/highlight';

test('highlights java with css variables and marks 1-based lines', async () => {
  const html = await highlightJava('interface A {\n  int x();\n}', [2]);
  expect(html).toContain('var(--shiki-');
  const lines = html.match(/<span class="line[^"]*"/g) ?? [];
  expect(lines).toEqual(['<span class="line"', '<span class="line is-hl"', '<span class="line"']);
});
