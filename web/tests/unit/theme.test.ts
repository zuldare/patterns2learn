import { getTheme, setTheme } from '../../src/lib/theme';

// happy-dom's Storage is a Proxy whose spied methods leak between tests,
// so each test gets a fresh in-memory fake installed on window.localStorage.
function installFakeStorage() {
  const data = new Map<string, string>();
  const fake = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
  };
  Object.defineProperty(window, 'localStorage', { value: fake, configurable: true });
  return fake;
}

beforeEach(() => {
  installFakeStorage();
});

test('setTheme survives a throwing localStorage', () => {
  window.localStorage.setItem = vi.fn(() => { throw new Error('denied'); });
  expect(() => setTheme('blueprint')).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('blueprint');
});
test('setTheme and getTheme survive a throwing localStorage getter', () => {
  Object.defineProperty(window, 'localStorage', {
    get() { throw new Error('denied'); },
    configurable: true,
  });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
  expect(() => setTheme('paper')).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('paper');
  expect(getTheme()).toBe('paper');
});
test('getTheme falls back to prefers-color-scheme', () => {
  window.localStorage.getItem = vi.fn(() => null);
  window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
  expect(getTheme()).toBe('blueprint');
});
test('stores theme as JSON string and reads it back', () => {
  setTheme('blueprint');
  expect(window.localStorage.getItem('p2l:theme')).toBe('"blueprint"');
  expect(getTheme()).toBe('blueprint');
});
test('invalid stored value falls back to media query', () => {
  window.localStorage.setItem('p2l:theme', 'garbage');
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
  expect(getTheme()).toBe('paper');
});
