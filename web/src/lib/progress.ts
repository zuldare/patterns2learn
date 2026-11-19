/** Local progress (spec §5.4). Every access is guarded: storage may be absent or throw. */

export type LessonProgress = { step: number; done: boolean; quiz?: number };
export type Progress = { lessons: Record<string, LessonProgress> };

const KEY = 'p2l:progress';

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { lessons: {} };
    const data: unknown = JSON.parse(raw);
    const lessons = (data as Progress | null)?.lessons;
    if (!lessons || typeof lessons !== 'object' || Array.isArray(lessons)) return { lessons: {} };
    return { lessons };
  } catch {
    return { lessons: {} };
  }
}

function update(slug: string, change: (prev: LessonProgress | undefined) => LessonProgress): void {
  try {
    const progress = loadProgress();
    progress.lessons[slug] = change(progress.lessons[slug]);
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable: the site works the same, progress is just not kept.
  }
}

export function saveStep(slug: string, step: number, total: number): void {
  update(slug, (prev) => {
    const next: LessonProgress = { step, done: Boolean(prev?.done) || step === total - 1 };
    if (prev?.quiz !== undefined) next.quiz = prev.quiz;
    return next;
  });
}

/** `score` is in [0, 1]. */
export function saveQuiz(slug: string, score: number): void {
  update(slug, (prev) => ({ step: prev?.step ?? 0, done: prev?.done ?? false, quiz: score }));
}
