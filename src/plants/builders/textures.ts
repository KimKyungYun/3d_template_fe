import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

// 바닥 질감 — 모두 밝은 회색 계열로 그려 재질 색과 곱해 쓴다 (테마마다 색만 바뀌고 무늬는 같다)

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function canvas(w: number, h: number, base: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = `rgb(${base},${base},${base})`;
  ctx.fillRect(0, 0, w, h);
  return { c, ctx };
}

/** 픽셀마다 밝기를 조금씩 흔든다 */
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, rand: () => number) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * amount;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function finish(c: HTMLCanvasElement, anisotropy = 8) {
  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

/** 잔디 결 — 얼룩과 잡티 */
function grass() {
  const size = 256;
  const { c, ctx } = canvas(size, size, 232);
  const rand = seeded(7);
  for (let i = 0; i < 140; i += 1) {
    const v = 200 + Math.floor(rand() * 55);
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 6 + rand() * 26, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, size, size, 34, rand);
  return finish(c);
}

/** 산책로 보도블록 — 엇갈려 쌓은 직사각형 블록과 줄눈 (한 장 = 2m) */
function paver() {
  const size = 256;
  const { c, ctx } = canvas(size, size, 150);
  const rand = seeded(11);
  const bw = size / 4;
  const bh = size / 8;
  for (let r = 0; r < 8; r += 1) {
    const shift = r % 2 === 0 ? 0 : bw / 2;
    for (let k = -1; k < 5; k += 1) {
      const v = 214 + Math.floor(rand() * 34);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(k * bw + shift + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }
  speckle(ctx, size, size, 18, rand);
  return finish(c);
}

/** 트랙 둘레 대형 타일 — 4×4 판과 가는 줄눈 (한 장 = 4m) */
function tile() {
  const size = 256;
  const { c, ctx } = canvas(size, size, 170);
  const rand = seeded(13);
  const t = size / 4;
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      const v = 222 + Math.floor(rand() * 26);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(i * t + 1, j * t + 1, t - 2, t - 2);
    }
  }
  speckle(ctx, size, size, 10, rand);
  return finish(c);
}

/** 축구장 잔디 깎은 줄무늬 — 밝은 줄·어두운 줄 한 쌍 (가로 방향) */
function stripes() {
  const size = 128;
  const { c, ctx } = canvas(size, size, 255);
  const rand = seeded(17);
  ctx.fillStyle = 'rgb(214,214,214)';
  ctx.fillRect(0, size / 2, size, size / 2);
  speckle(ctx, size, size, 22, rand);
  return finish(c);
}

/** 트랙·자전거길 고무 포장 알갱이 */
function rubber() {
  const size = 128;
  const { c, ctx } = canvas(size, size, 236);
  speckle(ctx, size, size, 46, seeded(19));
  return finish(c, 4);
}

/** 관람석 디딤판 — u 방향으로 좌석 하나, v 방향은 단 앞→뒤 (좌석은 단 뒤쪽 절반) */
function seats() {
  const w = 64;
  const h = 128;
  const { c, ctx } = canvas(w, h, 175);
  ctx.fillStyle = 'rgb(246,246,246)';
  ctx.fillRect(6, h * 0.42, w - 12, h * 0.5);
  ctx.fillStyle = 'rgb(220,220,220)';
  ctx.fillRect(6, h * 0.42, w - 12, h * 0.1);
  return finish(c, 4);
}

const MAKERS = { grass, paver, tile, stripes, rubber, seats } as const;
export type SurfaceKind = keyof typeof MAKERS;

const cache = new Map<SurfaceKind, CanvasTexture>();

/** 질감 텍스처 — 처음 쓸 때 한 번 만들어 계속 나눠 쓴다 */
export function surfaceTexture(kind: SurfaceKind): CanvasTexture {
  let tex = cache.get(kind);
  if (!tex) {
    tex = MAKERS[kind]();
    cache.set(kind, tex);
  }
  return tex;
}
