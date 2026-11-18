export type Tween = { cancel(): void; finished: Promise<void> };

/** Cubic ease-in-out on [0, 1]. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Drives `onFrame` with an eased progress in [0, 1] over `durationMs` using
 * requestAnimationFrame. `finished` resolves when the tween completes or is
 * cancelled (it never rejects), so awaiting code must check whether it was
 * cancelled before continuing.
 */
export function tween(durationMs: number, onFrame: (t: number) => void): Tween {
  let handle = 0;
  let done = false;
  let resolve!: () => void;
  const finished = new Promise<void>(r => (resolve = r));
  let start: number | undefined;

  const finish = () => {
    done = true;
    resolve();
  };
  const frame = (now: number) => {
    if (done) return;
    start ??= now;
    const linear = durationMs <= 0 ? 1 : Math.min(1, (now - start) / durationMs);
    onFrame(easeInOut(linear));
    if (linear >= 1) finish();
    else handle = window.requestAnimationFrame(frame);
  };
  handle = window.requestAnimationFrame(frame);

  return {
    cancel() {
      if (done) return;
      window.cancelAnimationFrame(handle);
      finish();
    },
    finished,
  };
}
