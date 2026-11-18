import { easeInOut, tween } from '../../src/engine/tween';

beforeEach(() => vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] }));
afterEach(() => vi.useRealTimers());

test('easeInOut is symmetric and bounded', () => {
  expect(easeInOut(0)).toBe(0);
  expect(easeInOut(1)).toBe(1);
  expect(easeInOut(0.5)).toBeCloseTo(0.5);
  expect(easeInOut(0.25)).toBeLessThan(0.25);
});
test('tween reaches t=1 and resolves', async () => {
  const frames: number[] = [];
  const t = tween(600, v => frames.push(v));
  await vi.advanceTimersByTimeAsync(700);
  await t.finished;
  expect(frames.at(-1)).toBe(1);
  expect(frames.every((v, i) => i === 0 || v >= frames[i - 1])).toBe(true);
});
test('cancel stops frames and resolves finished', async () => {
  const frames: number[] = [];
  const t = tween(600, v => frames.push(v));
  await vi.advanceTimersByTimeAsync(100);
  t.cancel();
  const n = frames.length;
  await vi.advanceTimersByTimeAsync(700);
  await t.finished;
  expect(frames.length).toBe(n);
  expect(frames.at(-1)).toBeLessThan(1);
});
