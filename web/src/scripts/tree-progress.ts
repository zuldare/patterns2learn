import { loadProgress } from '../lib/progress';

/** Marks completed lessons in the course tree (static HTML carries no progress). */
export function hydrateCourseTree(): void {
  const { lessons } = loadProgress();
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-lesson-link]')) {
    const slug = link.dataset.lessonLink ?? '';
    if (!lessons[slug]?.done) continue;
    link.classList.add('is-done');
    const mark = link.querySelector<HTMLElement>('[data-done-mark]');
    if (mark) mark.hidden = false;
  }
}

hydrateCourseTree();
