/*
  RTU 함 모델이 나눠 쓰는 지오메트리 조각 — 한 번 만들어 계속 쓴다.
  누를 일 없는 되풀이 장식(단자 나사·볼트·레일)은 merge 로 묶어 드로우콜을 아낀다.
*/
import { BoxGeometry, CatmullRomCurve3, CylinderGeometry, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BufferGeometry } from 'three';

type Vec = [number, number, number];

/** 처음 쓸 때 한 번만 만들어 계속 나눠 쓴다 */
export function once<T>(make: () => T): () => T {
  let value: T | null = null;

  return () => (value ??= make());
}

/** 자리를 옮긴 상자 하나 */
export function box(size: Vec, at: Vec): BufferGeometry {
  return new BoxGeometry(...size).translate(...at);
}

/** 원기둥 하나 — axis 로 눕힐 축을 고른다 (나사·글랜드·안테나) */
export function cylinder(radius: number, height: number, at: Vec, axis: 'x' | 'y' | 'z' = 'y', segments = 8): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius, height, segments);

  if (axis === 'x') geometry.rotateZ(Math.PI / 2);
  if (axis === 'z') geometry.rotateX(Math.PI / 2);

  return geometry.translate(...at);
}

/** 여러 조각을 한 지오메트리로 */
export function merge(parts: BufferGeometry[]): BufferGeometry {
  return mergeGeometries(parts)!;
}

export const vec = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** 꺾이는 점을 부드럽게 이은 전선 한 가닥 */
export function wire(points: Vector3[], radius: number, segments = 36): BufferGeometry {
  return new TubeGeometry(new CatmullRomCurve3(points, false, 'catmullrom', 0.3), segments, radius, 5, false);
}

/** 중간이 끊긴 전선 — 통신단절 가닥을 둘로 나눠 그리고, 틈 한가운데 자리를 함께 돌려준다 */
export function cutWire(points: Vector3[], radius: number): { geometry: BufferGeometry; gap: Vector3 } {
  const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.3);
  const sampled = curve.getPoints(48);

  return {
    geometry: merge([wire(sampled.slice(0, 21), radius, 24), wire(sampled.slice(28), radius, 24)]),
    gap: curve.getPoint(0.5),
  };
}

/** 표시등·끊김 점에 쓰는 단위 구 */
export const UNIT_SPHERE = once(() => new SphereGeometry(1, 10, 8));
