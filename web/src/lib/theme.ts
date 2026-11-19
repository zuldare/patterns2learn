export const THEMES = ['paper', 'blueprint', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const KEY = 'p2l:theme';

export function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v);
}

/** The theme the header toggle switches to: paper → blueprint → dark → paper. */
export function nextTheme(t: Theme): Theme {
  return THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]!;
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
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'paper';
}

export function setTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // storage unavailable: the data-theme attribute is enough for this page view
  }
}
