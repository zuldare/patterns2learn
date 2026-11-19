import type { QuizQuestion } from '../../src/engine/types';
import { scoreQuiz } from '../../src/lib/quiz';

test('scoreQuiz counts correct answers, unanswered as wrong', () => {
  const qs = [{ answer: 0 }, { answer: 2 }, { answer: 1 }, { answer: 1 }] as QuizQuestion[];
  expect(scoreQuiz([0, 2, null, 0], qs)).toBe(0.5);
});
test('scoreQuiz of no questions is 0', () => {
  expect(scoreQuiz([], [])).toBe(0);
});

describe('mountQuiz', () => {
  function setup() {
    document.body.innerHTML = `
      <form class="quiz" data-slug="strategy" data-msg-correct="Correct!" data-msg-incorrect="Nope" data-msg-score="Score">
        <fieldset data-q="0" data-answer="1"><input type="radio" name="q0" value="0"><input type="radio" name="q0" value="1">
          <p data-status></p><p class="quiz-explain" hidden>why0</p></fieldset>
        <fieldset data-q="1" data-answer="0"><input type="radio" name="q1" value="0"><input type="radio" name="q1" value="1">
          <p data-status></p><p class="quiz-explain" hidden>why1</p></fieldset>
        <button type="submit">Check</button><p data-result></p>
      </form>`;
    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
      configurable: true,
    });
    return document.querySelector('form')!;
  }
  test('shows explanations only for wrong answers, marks correct ones and stores the score', async () => {
    const { mountQuiz } = await import('../../src/scripts/quiz');
    const form = setup();
    mountQuiz(form);
    form.querySelector<HTMLInputElement>('[name=q0][value="1"]')!.checked = true; // right
    form.querySelector<HTMLInputElement>('[name=q1][value="1"]')!.checked = true; // wrong
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    const [a, b] = [...form.querySelectorAll('fieldset')];
    expect(a!.classList.contains('is-correct')).toBe(true);
    expect(a!.querySelector<HTMLElement>('.quiz-explain')!.hidden).toBe(true);
    expect(b!.classList.contains('is-wrong')).toBe(true);
    expect(b!.querySelector<HTMLElement>('.quiz-explain')!.hidden).toBe(false);
    expect(form.querySelector('[data-result]')!.textContent).toBe('Score: 1 / 2');
    expect(JSON.parse(window.localStorage.getItem('p2l:progress')!).lessons.strategy.quiz).toBe(0.5);
  });
});
