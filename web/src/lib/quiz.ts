import type { QuizQuestion } from '../engine/types';

/** Fraction of correct answers in [0, 1]; unanswered (null) counts as wrong. */
export function scoreQuiz(answers: (number | null)[], questions: QuizQuestion[]): number {
  if (questions.length === 0) return 0;
  const right = questions.filter((q, i) => answers[i] === q.answer).length;
  return right / questions.length;
}
