export type Theme = 'paper' | 'blueprint';

const KEY = 'p2l:theme';

function isTheme(v: unknown): v is Theme {
  return v === 'paper' || v === 'blueprint';
}

function readStored(): unknown {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getTheme(): Theme {
  const stored = readStored();
  if (isTheme(stored)) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'blueprint' : 'paper';
}

export function setTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // storage unavailable: the data-theme attribute is enough for this page view
  }
}
