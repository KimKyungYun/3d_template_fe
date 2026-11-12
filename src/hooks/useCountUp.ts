import { useEffect, useRef, useState } from 'react';

interface Options {
  duration?: number;
  enabled?: boolean;
}

const easeOutExpo = (x: number) => (x === 1 ? 1 : 1 - 2 ** (-10 * x));

/**
 * 목표값까지 굴러가는 수. 값이 바뀌면 지금 보이는 수에서 새 목표로 이어서 굴러간다.
 * 움직임을 줄이기로 한 환경이면 바로 목표값을 낸다.
 */
export function useCountUp(target: number, { duration = 900, enabled = true }: Options = {}) {
  const [value, setValue] = useState(enabled ? 0 : target);
  const fromRef = useRef(value);

  useEffect(() => {
    if (!enabled) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = reduced ? 1 : Math.min(1, (now - start) / duration);
      const next = from + (target - from) * easeOutExpo(progress);

      fromRef.current = next;
      setValue(next);

      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);

  return enabled ? value : target;
}
