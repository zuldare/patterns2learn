/** Below 1200px the course and cheatsheet cards live in a drawer opened from the header (lessons and cheatsheets). */
function mountTreeDrawer(): void {
  const tree = document.getElementById('course-tree');
  const toggles = document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-tree"]');
  const opener = document.querySelector<HTMLButtonElement>('.site-header [data-action="toggle-tree"]');
  if (!tree) return;
  const set = (open: boolean, restoreFocus = false) => {
    tree.dataset.open = String(open);
    for (const t of toggles) t.setAttribute('aria-expanded', String(open));
    if (open) tree.querySelector<HTMLElement>('a, button')?.focus();
    else if (restoreFocus) opener?.focus();
  };
  for (const t of toggles) {
    t.addEventListener('click', () => set(tree.dataset.open !== 'true', true));
  }
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && tree.dataset.open === 'true') set(false, true);
  });
}

mountTreeDrawer();
