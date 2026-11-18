import { marked } from 'marked';
import { parse as parseYaml } from 'yaml';
import type { LessonText, StepText } from '../engine/types';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const STEP_RE = /^## @step:([a-z0-9-]+)\s+[—-]\s+(.+?)\s*$/;
const DESCRIBE_RE = /^@describe:[ \t]*(.*)$/;
const CALLOUT_RE = /^>\s*\[!(problem|key-idea|spring|warning)\]\s*$/;

function renderCallouts(body: string): string {
  const lines = body.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = CALLOUT_RE.exec(lines[i]);
    if (!m) {
      out.push(lines[i]);
      continue;
    }
    const inner: string[] = [];
    while (i + 1 < lines.length && /^>/.test(lines[i + 1])) {
      i++;
      inner.push(lines[i].replace(/^>\s?/, ''));
    }
    const html = marked.parse(inner.join('\n'), { async: false });
    out.push('', `<aside class="callout callout--${m[1]}">${html}</aside>`, '');
  }
  return out.join('\n');
}

function renderStep(id: string, title: string, rawLines: string[]): StepText {
  let describe = '';
  const kept: string[] = [];
  for (const line of rawLines) {
    const d = DESCRIBE_RE.exec(line);
    if (d) describe = d[1].trim();
    else kept.push(line);
  }
  const html = marked.parse(renderCallouts(kept.join('\n').trim()), { async: false });
  return { id, title, html, describe };
}

export function parseLessonText(markdown: string, file: string): LessonText {
  const fm = FRONTMATTER_RE.exec(markdown);
  if (!fm) throw new Error(`${file}: missing YAML frontmatter`);
  const meta = parseYaml(fm[1]) as Record<string, unknown> | null;
  if (!meta || typeof meta !== 'object') throw new Error(`${file}: invalid frontmatter`);

  const steps: StepText[] = [];
  let current: { id: string; title: string; lines: string[] } | null = null;
  const flush = () => {
    if (current) steps.push(renderStep(current.id, current.title, current.lines));
  };
  for (const line of fm[2].split('\n')) {
    const m = STEP_RE.exec(line);
    if (m) {
      flush();
      current = { id: m[1], title: m[2], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();

  return {
    title: meta.title as string,
    summary: meta.summary as string,
    minutes: meta.minutes as number,
    level: meta.level as LessonText['level'],
    steps,
    recap: meta.recap as LessonText['recap'],
    quiz: (meta.quiz ?? []) as LessonText['quiz'],
  };
}
