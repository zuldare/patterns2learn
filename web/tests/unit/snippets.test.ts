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
test('a region that leaves blocks open is closed with an ellipsis and the missing braces', () => {
  const s = extractRegion(['// @step:head', '@Component', 'public class A {', '    private int x;', '// @end', '}'].join('\n'), 'A.java', 'head');
  expect(s.code).toBe('@Component\npublic class A {\n    private int x;\n    // …\n}');
  expect(s.lineCount).toBe(3); // highlights still address the real lines only
});
test('braces inside strings and comments do not count', () => {
  const s = extractRegion(['// @step:r', 'String h = "{bcrypt}"; // {noop}', 'char c = \'{\';', '// @end'].join('\n'), 'A.java', 'r');
  expect(s.code).toBe('String h = "{bcrypt}"; // {noop}\nchar c = \'{\';');
});
