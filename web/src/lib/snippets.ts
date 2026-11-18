import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Snippet = { file: string; region: string; code: string; lineCount: number };

export class SnippetError extends Error {
  file: string;
  region: string;

  constructor(file: string, region: string, detail: string) {
    super(`${file}#${region}: ${detail}`);
    this.name = 'SnippetError';
    this.file = file;
    this.region = region;
  }
}

const STEP_RE = /^\s*\/\/\s*@step:([a-z0-9-]+)\s*$/;
const END_RE = /^\s*\/\/\s*@end\s*$/;

export function extractRegion(source: string, file: string, region: string): Snippet {
  const lines = source.split('\n');

  const starts = lines.flatMap((line, i) => {
    const m = STEP_RE.exec(line);
    return m && m[1] === region ? [i] : [];
  });
  if (starts.length === 0) throw new SnippetError(file, region, 'region not found');
  if (starts.length > 1) {
    throw new SnippetError(file, region, `region defined ${starts.length} times`);
  }

  const start = starts[0];
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    const step = STEP_RE.exec(lines[i]);
    if (step) {
      throw new SnippetError(file, region, `nested region "${step[1]}" inside "${region}"`);
    }
    if (END_RE.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (end === -1) throw new SnippetError(file, region, 'region not closed with // @end');

  const body = lines.slice(start + 1, end);
  const indents = body
    .filter((line) => line.trim() !== '')
    .map((line) => /^[ \t]*/.exec(line)?.[0].length ?? 0);
  const common = indents.length > 0 ? Math.min(...indents) : 0;
  const code = body
    .map((line) => (line.trim() === '' ? '' : line.slice(common)))
    .join('\n');

  return { file, region, code, lineCount: body.length };
}

export function loadSnippet(examplesRoot: string, file: string, region: string): Snippet {
  const path = join(examplesRoot, file);
  if (!existsSync(path)) throw new SnippetError(file, region, 'file not found');
  return extractRegion(readFileSync(path, 'utf8'), file, region);
}
