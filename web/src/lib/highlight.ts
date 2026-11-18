import {
  createCssVariablesTheme,
  createHighlighter,
  createJavaScriptRegexEngine,
  type Highlighter,
  type ShikiTransformer,
} from 'shiki';

const theme = createCssVariablesTheme({
  name: 'p2l',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

let highlighter: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({
    themes: [theme],
    langs: ['java'],
    // Pure-JS regex engine: no WASM to load at build time (or under happy-dom).
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

/** Adds `is-hl` to the given 1-based lines (relative to the snippet). */
function highlightLines(lines: number[]): ShikiTransformer {
  const set = new Set(lines);
  return {
    name: 'p2l:highlight-lines',
    line(node, line) {
      if (set.has(line)) this.addClassToHast(node, 'is-hl');
    },
  };
}

/** Build-time Java highlighting; colours come from the `--shiki-*` tokens. */
export async function highlightJava(code: string, highlight: number[] = []): Promise<string> {
  const h = await getHighlighter();
  return h.codeToHtml(code, { lang: 'java', theme: 'p2l', transformers: [highlightLines(highlight)] });
}
