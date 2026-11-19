import { LessonPlayer } from '../../src/engine/player';
import { renderScene } from '../../src/engine/render';
import { indexWithPackets, scene } from './fixtures/scene';

let players: LessonPlayer[] = [];
function mount(reducedMotion = false, onStep?: (i: number) => void) {
  const root = document.createElement('div'); root.innerHTML = renderScene(scene);
  document.body.append(root);
  const p = new LessonPlayer(root, scene, { reducedMotion, onStep });
  players.push(p);
  return { root, p };
}
const visibleIds = (root: HTMLElement) =>
  [...root.querySelectorAll('.iso-entity:not(.is-hidden)')].map(e => (e as HTMLElement).dataset.id).sort();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] });
});
afterEach(() => {
  players.forEach(p => p.destroy()); players = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
});

test('mount applies step 0', () => {
  const { root, p } = mount();
  expect(p.index).toBe(0);
  expect(visibleIds(root)).toEqual([...scene.steps[0].visible].sort());
  expect(root.dataset.step).toBe(scene.steps[0].id);
});
test('goTo applies the step snapshot', () => {
  const { root, p } = mount(); p.goTo(2);
  expect(visibleIds(root)).toEqual([...scene.steps[2].visible].sort());
  expect(root.dataset.step).toBe(scene.steps[2].id);
  expect(root.querySelector('svg')!.getAttribute('aria-describedby')).toBe(`describe-${scene.steps[2].id}`);
});
test('highlight and link visibility follow the snapshot', () => {
  const { root, p } = mount(); p.goTo(4);
  const hl = [...root.querySelectorAll('.is-highlighted')].map(e => (e as HTMLElement).dataset.id);
  expect(hl).toEqual(['strategy']);
  const visibleLinks = [...root.querySelectorAll('.iso-link:not(.is-hidden)')].map(e => (e as HTMLElement).dataset.id).sort();
  expect(visibleLinks).toEqual(['l-call', 'l-impl', 'l-inject']);
  p.goTo(0);
  expect(root.querySelectorAll('.iso-link:not(.is-hidden)').length).toBe(0);
  expect(root.querySelectorAll('.is-highlighted').length).toBe(0);
});
test('goTo clamps out-of-range indices', () => {
  const { p } = mount(); p.goTo(99); expect(p.index).toBe(scene.steps.length - 1); p.goTo(-3); expect(p.index).toBe(0);
});
test('next and prev move one step and clamp', () => {
  const { p } = mount(true);
  p.prev(); expect(p.index).toBe(0);
  p.next(); p.next(); expect(p.index).toBe(2);
  p.prev(); expect(p.index).toBe(1);
});
test('onStep fires after each applied step with the index', () => {
  const calls: number[] = [];
  const { p } = mount(true, i => calls.push(i));
  p.goTo(2); p.next();
  expect(calls).toEqual([0, 2, 3]);
});
test('rapid goTo during animation ends on last snapshot with no orphan packets', async () => {
  const { root, p } = mount();
  for (let i = 0; i < 5; i++) p.next();
  await vi.runAllTimersAsync();
  expect(p.index).toBe(5);
  expect(visibleIds(root)).toEqual([...scene.steps[5].visible].sort());
  expect(root.querySelectorAll('.iso-packets > *').length).toBe(scene.steps[5].packets.length);
});
test('leaving a packet step mid-animation removes its packet', async () => {
  const { root, p } = mount(); p.goTo(indexWithPackets);
  await vi.advanceTimersByTimeAsync(200);
  expect(root.querySelectorAll('.iso-packets > *').length).toBe(1);
  p.goTo(4);
  await vi.runAllTimersAsync();
  expect(root.querySelectorAll('.iso-packets > *').length).toBe(0);
});
test('animated packet rests at the destination end of its link', async () => {
  const { root, p } = mount(); p.goTo(indexWithPackets);
  await vi.runAllTimersAsync();
  const link = root.querySelector<SVGGElement>('.iso-link[data-id="l-call"]')!;
  const pk = root.querySelector('.iso-packets > *')!;
  expect(pk.textContent).toContain('plan=monthly');
  expect(pk.getAttribute('transform')).toBe(`translate(${link.dataset.x2} ${link.dataset.y2})`);
});
test('reverse packet rests at the link origin', async () => {
  const { root, p } = mount(); p.goTo(5);
  await vi.runAllTimersAsync();
  const link = root.querySelector<SVGGElement>('.iso-link[data-id="l-call"]')!;
  const pk = root.querySelector('.iso-packets > *')!;
  expect(pk.getAttribute('transform')).toBe(`translate(${link.dataset.x1} ${link.dataset.y1})`);
});
test('reduced motion places packets at destination without animating', () => {
  const raf = vi.spyOn(window, 'requestAnimationFrame');
  const { root, p } = mount(true); p.goTo(indexWithPackets);
  expect(raf).not.toHaveBeenCalled();
  expect(root.querySelectorAll('.iso-packets > *').length).toBeGreaterThan(0);
});
test('keyboard navigation', () => {
  const { root, p } = mount();
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); expect(p.index).toBe(1);
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' })); expect(p.index).toBe(scene.steps.length - 1);
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })); expect(p.index).toBe(scene.steps.length - 2);
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' })); expect(p.index).toBe(0);
});
test('keys with modifiers are left to the browser', () => {
  const { root, p } = mount();
  for (const mod of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const) {
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, [mod]: true });
    root.dispatchEvent(ev);
    expect(p.index).toBe(0);
    expect(ev.defaultPrevented).toBe(false);
  }
});
test('keys typed inside form controls, forms and code are left alone', () => {
  const { root, p } = mount();
  root.insertAdjacentHTML(
    'beforeend',
    '<form><fieldset><input type="radio" name="q" id="r1"><input type="radio" name="q"></fieldset></form>' +
      '<textarea></textarea><select><option>a</option></select><div contenteditable="true"><span id="ce">x</span></div>' +
      '<pre><code id="code">x</code></pre>',
  );
  const targets = ['#r1', 'textarea', 'select', '#ce', '#code', 'form'];
  for (const sel of targets) {
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    root.querySelector(sel)!.dispatchEvent(ev);
    expect(p.index, sel).toBe(0);
    expect(ev.defaultPrevented, sel).toBe(false);
  }
  // A key on the lesson itself still navigates.
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  expect(p.index).toBe(1);
});
test('destroy removes keyboard handling and packets', async () => {
  const { root, p } = mount(); p.goTo(indexWithPackets);
  p.destroy();
  await vi.runAllTimersAsync();
  expect(root.querySelectorAll('.iso-packets > *').length).toBe(0);
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  expect(p.index).toBe(indexWithPackets);
});
