import { saveQuiz } from '../lib/progress';
import { scoreQuiz } from '../lib/quiz';
import type { QuizQuestion } from '../engine/types';

/** Wires one quiz form: check marks every question, shows explanations for wrong ones, stores the score. */
export function mountQuiz(form: HTMLFormElement): void {
  const sets = [...form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-q]')];
  const result = form.querySelector<HTMLElement>('[data-result]');
  const msg = form.dataset;

  const reset = () => {
    for (const fs of sets) {
      fs.classList.remove('is-correct', 'is-wrong');
      const status = fs.querySelector<HTMLElement>('[data-status]');
      if (status) status.textContent = '';
      const explain = fs.querySelector<HTMLElement>('.quiz-explain');
      if (explain) explain.hidden = true;
    }
    if (result) result.textContent = '';
  };

  form.addEventListener('change', reset);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const answers = sets.map((fs) => {
      const checked = fs.querySelector<HTMLInputElement>('input:checked');
      return checked ? Number(checked.value) : null;
    });
    const questions = sets.map((fs) => ({ answer: Number(fs.dataset.answer) })) as QuizQuestion[];
    sets.forEach((fs, i) => {
      const ok = answers[i] === questions[i]!.answer;
      fs.classList.toggle('is-correct', ok);
      fs.classList.toggle('is-wrong', !ok);
      const status = fs.querySelector<HTMLElement>('[data-status]');
      if (status) status.textContent = `${ok ? '✓' : '✗'} ${ok ? msg.msgCorrect : msg.msgIncorrect}`;
      const explain = fs.querySelector<HTMLElement>('.quiz-explain');
      if (explain) explain.hidden = ok;
    });
    const score = scoreQuiz(answers, questions);
    const right = Math.round(score * sets.length);
    if (result) result.textContent = `${msg.msgScore}: ${right} / ${sets.length}`;
    if (form.dataset.slug) saveQuiz(form.dataset.slug, score);
  });
}

for (const form of document.querySelectorAll<HTMLFormElement>('form.quiz')) mountQuiz(form);
