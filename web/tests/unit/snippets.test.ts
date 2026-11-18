import { extractRegion, loadSnippet } from '../../src/lib/snippets';

const src = [
  'class A {',
  '    // @step:body',
  '    void run() {',
  '        go();',
  '    }',
  '    // @end',
  '}',
].join('\n');

test('extracts and dedents a region without marker lines', () => {
  const s = extractRegion(src, 'A.java', 'body');
  expect(s.code).toBe('void run() {\n    go();\n}');
  expect(s.lineCount).toBe(3);
});
test('missing region', () => expect(() => extractRegion(src, 'A.java', 'nope')).toThrow('A.java#nope: region not found'));
test('duplicate region', () => expect(() => extractRegion(src + '\n' + src, 'A.java', 'body')).toThrow('A.java#body: region defined 2 times'));
test('unclosed region', () => expect(() => extractRegion('// @step:x\nfoo();', 'B.java', 'x')).toThrow('B.java#x: region not closed with // @end'));
test('nested region', () => expect(() => extractRegion('// @step:a\n// @step:b\n// @end\n// @end', 'C.java', 'a')).toThrow('C.java#a: nested region "b" inside "a"'));
test('missing file', () => expect(() => loadSnippet('/nonexistent', 'X.java', 'r')).toThrow('X.java#r: file not found'));
