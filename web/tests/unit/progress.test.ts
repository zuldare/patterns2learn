import { loadProgress, saveQuiz, saveStep } from '../../src/lib/progress';

// happy-dom's Storage is a Proxy whose spied methods leak between tests,
// so each test gets a fresh in-memory fake installed on window.localStorage.
function installFakeStorage() {
  const data = new Map<string, string>();
  const fake = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
    clear: vi.fn(() => data.clear()),
  };
  Object.defineProperty(window, 'localStorage', { value: fake, configurable: true });
  return fake;
}

let store: ReturnType<typeof installFakeStorage>;
beforeEach(() => {
  store = installFakeStorage();
});

test('round-trips step and marks done on last step', () => {
  saveStep('strategy', 3, 9);
  expect(loadProgress().lessons.strategy).toEqual({ step: 3, done: false });
  saveStep('strategy', 8, 9);
  expect(loadProgress().lessons.strategy.done).toBe(true);
});
test('done stays true when going back', () => {
  saveStep('strategy', 8, 9);
  saveStep('strategy', 2, 9);
  expect(loadProgress().lessons.strategy).toEqual({ step: 2, done: true });
});
test('quiz score is stored and preserved by saveStep; saveQuiz keeps step/done', () => {
  saveStep('strategy', 8, 9);
  saveQuiz('strategy', 0.75);
  saveStep('strategy', 4, 9);
  expect(loadProgress().lessons.strategy).toEqual({ step: 4, done: true, quiz: 0.75 });
  saveQuiz('strategy', 1);
  expect(loadProgress().lessons.strategy).toEqual({ step: 4, done: true, quiz: 1 });
});
test('saveQuiz on an unseen lesson creates a valid entry', () => {
  saveQuiz('strategy', 0.5);
  expect(loadProgress().lessons.strategy).toEqual({ step: 0, done: false, quiz: 0.5 });
});
test('corrupt JSON yields empty progress', () => {
  window.localStorage.setItem('p2l:progress', '{nope');
  expect(loadProgress()).toEqual({ lessons: {} });
  window.localStorage.setItem('p2l:progress', '{"lessons":5}');
  expect(loadProgress()).toEqual({ lessons: {} });
});
test('throwing storage is silent', () => {
  store.getItem.mockImplementation(() => { throw new Error('denied'); });
  store.setItem.mockImplementation(() => { throw new Error('denied'); });
  expect(() => saveStep('strategy', 1, 9)).not.toThrow();
  expect(() => saveQuiz('strategy', 1)).not.toThrow();
  expect(loadProgress()).toEqual({ lessons: {} });
});
test('throwing localStorage getter is silent', () => {
  Object.defineProperty(window, 'localStorage', {
    get() { throw new Error('denied'); },
    configurable: true,
  });
  expect(() => saveStep('strategy', 1, 9)).not.toThrow();
  expect(loadProgress()).toEqual({ lessons: {} });
});
