/** mulberry32 — 시드 고정 난수. 같은 빌드에서는 늘 같은 값이 나온다 */
export function createRandom(seed: number) {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 문자열 → 시드 */
export function seedOf(text: string) {
  let h = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

export const round1 = (v: number) => Math.round(v * 10) / 10;
