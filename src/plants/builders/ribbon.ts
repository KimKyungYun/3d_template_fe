import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Vec3 } from '@/plants/model/types';

/**
 * 중심선 점열을 높이 y 에 폭 width 의 평평한 띠로 만든다 (법선은 위쪽).
 * UV 는 평면 좌표(x, z) / uvScale 이라 띠가 휘거나 여러 장이어도 무늬가 끊기지 않는다
 */
export function ribbonGeometry(points: Vec3[], width: number, y: number, closed = false, uvScale = 1): BufferGeometry {
  const n = points.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const h = width / 2;
  for (let i = 0; i < n; i += 1) {
    const prev = points[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
    const next = points[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    let tx = next[0] - prev[0];
    let tz = next[2] - prev[2];
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    const [x, , z] = points[i];
    pos.push(x + tz * h, y, z - tx * h, x - tz * h, y, z + tx * h);
    uv.push((x + tz * h) / uvScale, (z - tx * h) / uvScale, (x - tz * h) / uvScale, (z + tx * h) / uvScale);
  }
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i += 1) {
    const a = i * 2;
    const b = ((i + 1) % n) * 2;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
