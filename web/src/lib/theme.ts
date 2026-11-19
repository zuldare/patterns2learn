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

/**
 * Stored theme, else the OS preference. Reference implementation kept under
 * unit test: the initial theme of every page is applied before first paint by
 * the inline script in layouts/BaseLayout.astro, which is the source of truth
 * (it also honours `?theme=`). Keep both rules in sync.
 */
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
