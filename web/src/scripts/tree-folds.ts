/**
 * Remembers which parts of the course tree the reader folded (a per-viewer convenience, so it
 * lives in localStorage and the page works the same without it). The category of the lesson
 * being read always opens.
 */
const KEY = 'p2l:tree';

function load(): Record<string, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function save(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: folding still works, it just isn't remembered */
  }
}

const tree = document.getElementById('course-tree');
if (tree) {
  const state = load();
  const folds = tree.querySelectorAll<HTMLDetailsElement>('details[data-tree-key]');
  for (const d of folds) {
    const key = d.dataset.treeKey!;
    if (state[key] === false) d.open = false;
    if (d.dataset.current === 'true') d.open = true;   // the lesson you're reading stays in view
    d.addEventListener('toggle', () => {
      state[key] = d.open;
      save(state);
    });
  }
}
