import { setTheme, type Theme } from '../lib/theme';

function current(): Theme {
  return document.documentElement.dataset.theme === 'blueprint' ? 'blueprint' : 'paper';
}

for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-theme"]')) {
  btn.addEventListener('click', () => {
    setTheme(current() === 'blueprint' ? 'paper' : 'blueprint');
  });
}
