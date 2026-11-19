import { LessonPlayer } from '../engine/player';
import type { Scene } from '../engine/types';
import { loadProgress, saveStep } from '../lib/progress';
import './tree-progress';

const CODE_BREAKPOINT = '(max-width: 959.98px)';

function mountCodePanel(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('.code-panel');
  const toggle = root.querySelector<HTMLButtonElement>('[data-action="toggle-code"]');
  if (!panel) return;
  const set = (open: boolean) => {
    panel.dataset.open = String(open);
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = (open ? toggle.dataset.labelOpen : toggle.dataset.labelClosed) ?? toggle.textContent;
  };
  set(!window.matchMedia(CODE_BREAKPOINT).matches);
  panel.dataset.mounted = '';
  toggle?.addEventListener('click', () => set(panel.dataset.open !== 'true'));
}

function mountTreeDrawer(): void {
  const tree = document.getElementById('course-tree');
  const toggles = document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-tree"]');
  const opener = document.querySelector<HTMLButtonElement>('.site-header [data-action="toggle-tree"]');
  if (!tree) return;
  const set = (open: boolean, restoreFocus = false) => {
    tree.dataset.open = String(open);
    for (const t of toggles) t.setAttribute('aria-expanded', String(open));
    if (open) tree.querySelector<HTMLElement>('a, button')?.focus();
    else if (restoreFocus) opener?.focus();
  };
  for (const t of toggles) {
    t.addEventListener('click', () => set(tree.dataset.open !== 'true', true));
  }
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && tree.dataset.open === 'true') set(false, true);
  });
}

function mountLesson(root: HTMLElement): void {
  const data = root.querySelector('script[data-lesson-scene]')?.textContent;
  if (!data) return;
  const scene = JSON.parse(data) as Scene;
  const ids = scene.steps.map((s) => s.id);
  const slug = root.dataset.lesson ?? '';
  const labels = [...root.querySelectorAll<HTMLElement>('.step-text')].map(
    (sec) => `${sec.querySelector('.step-text__count')?.textContent ?? ''}: ${sec.querySelector('.step-text__title')?.textContent ?? ''}`,
  );
  const prev = root.querySelectorAll<HTMLButtonElement>('[data-action="prev"]');
  const next = root.querySelectorAll<HTMLButtonElement>('[data-action="next"]');
  const gotos = root.querySelectorAll<HTMLButtonElement>('[data-goto]');
  const status = root.querySelector<HTMLElement>('[data-step-status]');
  let mounted = false;

  const indexFromHash = (): number => {
    const m = /^#step-(.+)$/.exec(window.location.hash);
    if (!m) return -1;
    try {
      return ids.indexOf(decodeURIComponent(m[1]!));
    } catch {
      return -1; // malformed percent-encoding: ignore the hash
    }
  };

  const sync = (i: number) => {
    for (const b of prev) b.disabled = i === 0;
    for (const b of next) b.disabled = i === ids.length - 1;
    gotos.forEach((b, j) => {
      if (j === i) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
      b.classList.toggle('is-done', j < i);
    });
    if (!mounted) return;
    const hash = `#step-${ids[i]}`;
    if (window.location.hash !== hash) history.replaceState(history.state, '', hash);
    if (status) status.textContent = labels[i] ?? '';
    saveStep(slug, i, ids.length);
  };

  const player = new LessonPlayer(root, scene, {
    onStep: sync,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  const start = indexFromHash();
  // A #step-<id> link wins; otherwise resume where the reader left off.
  const saved = loadProgress().lessons[slug]?.step;
  const resume = start >= 0 ? start : Number.isInteger(saved) && saved! > 0 && saved! < ids.length ? saved! : 0;
  if (resume > 0) player.goTo(resume);
  // A #step-<id> deep link restores the step; the lesson UI is laid out from
  // the top (diagram first), so undo the browser's jump to the text section.
  if (start >= 0) window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });
  mounted = true;

  for (const b of prev) b.addEventListener('click', () => player.prev());
  for (const b of next) b.addEventListener('click', () => player.next());
  for (const b of gotos) b.addEventListener('click', () => player.goTo(Number(b.dataset.goto)));

  window.addEventListener('hashchange', () => {
    const i = indexFromHash();
    if (i >= 0 && i !== player.index) player.goTo(i);
  });

  mountCodePanel(root);
}

const root = document.querySelector<HTMLElement>('[data-lesson]');
if (root) mountLesson(root);
mountTreeDrawer();
