import { getTheme, isTheme, nextTheme, setTheme } from '../lib/theme';

function current() {
  const t = document.documentElement.dataset.theme;
  return isTheme(t) ? t : getTheme();
}

for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-theme"]')) {
  btn.addEventListener('click', () => {
    setTheme(nextTheme(current()));
  });
}
