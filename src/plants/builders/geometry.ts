/*
  가대·부재 만들기 — 발전소 빌더가 함께 쓰는 지오메트리 도구.
  모듈 크기는 발전소마다 다르므로 피치를 쓰는 함수는 ModuleSize 를 인자로 받는다.
*/
import { Matrix4, Quaternion, Vector3 } from 'three';
import type { FrameSet, ModuleSize, Vec3 } from '@/plants/model/types';

export const MODULE_GAP = 0.02;

/**
 * 지붕면(roofY) 기준 부재 중심 높이. 모듈 밑면과 퍼린 윗면이 거의 같은 높이에 있으면
 * 멀리서 깊이 값이 뒤엉켜 깜빡이므로, 맞닿는 면 사이에 틈을 두거나 확실히 관통시킨다
 */
export const LAYER_Y = { module: 0.09, purlin: -0.02, girder: -0.12 } as const;

/** 장변 방향 모듈 간격 (m) */
export const pitchLong = (size: ModuleSize) => size.length + MODULE_GAP;

/** 단변 방향 모듈 간격 (m) */
export const pitchShort = (size: ModuleSize) => size.width + MODULE_GAP;

const Z_AXIS = new Vector3(0, 0, 1);
const UP = new Vector3(0, 1, 0);

/** 두 점 사이를 잇는 단위 박스(1×1×1) 부재의 변환행렬 — 단면 w×h, 길이 방향이 로컬 z */
export function beamMatrix(p0: Vector3, p1: Vector3, w: number, h: number): Matrix4 {
  const dir = new Vector3().subVectors(p1, p0);
  const len = dir.length();
  dir.normalize();
  const q = new Quaternion();

  if (Math.abs(dir.dot(UP)) > 0.999) {
    // 수직 부재는 롤이 정해지지 않으므로 x 축 기준으로 세운다
    q.setFromAxisAngle(new Vector3(1, 0, 0), dir.y > 0 ? -Math.PI / 2 : Math.PI / 2);
  } else {
    q.setFromUnitVectors(Z_AXIS, dir);
  }

  const mid = new Vector3().addVectors(p0, p1).multiplyScalar(0.5);

  return new Matrix4().compose(mid, q, new Vector3(w, h, len));
}

/** 모듈 박스(로컬 x=장변, z=단변) 행렬: 위치·좌우축(across)·진행축(along)·경사 */
export function moduleMatrix(position: Vector3, across: Vector3, along: Vector3, tilt: number): Matrix4 {
  const basis = new Matrix4().makeBasis(across, UP, along);
  const tiltM = new Matrix4().makeRotationZ(tilt);
  const m = new Matrix4().makeTranslation(position.x, position.y, position.z);

  return m.multiply(basis).multiply(tiltM);
}

/** 진행 방향(along, 수평)으로부터 우측 수평축 across = UP × along */
export function acrossOf(along: Vector3): Vector3 {
  return new Vector3().crossVectors(UP, along).normalize();
}

export interface TableOptions {
  center: Vector3;
  /** 진행축(단변 방향)의 수평 방위각 (rad, +z 기준 반시계) */
  yaw: number;
  /** 장변 방향(across)으로 놓이는 모듈 수 */
  rows: number;
  /** 단변 방향(along)으로 놓이는 모듈 수 */
  cols: number;
  /** across 쪽이 올라가는 경사 (rad) */
  tilt: number;
  postHeight: number;
  /** along 방향 기둥 수 */
  postsAlong: number;
  /** across 방향 기둥 수 */
  postsAcross: number;
  baseY?: number;
}

export interface TableResult {
  modules: Matrix4[];
  frame: FrameSet;
}

/** 평판형 가대 한 동(기둥·거더·퍼린·모듈)을 만든다 */
export function buildTable(o: TableOptions, size: ModuleSize): TableResult {
  const baseY = o.baseY ?? 0;
  const along = new Vector3(Math.sin(o.yaw), 0, Math.cos(o.yaw));
  const across = acrossOf(along);
  const long = pitchLong(size);
  const short = pitchShort(size);
  const halfX = (o.rows * long) / 2;
  const halfZ = (o.cols * short) / 2;
  const cosT = Math.cos(o.tilt);
  const sinT = Math.sin(o.tilt);
  const topY = baseY + o.postHeight;
  const roofY = (x: number) => topY + x * sinT;

  const point = (x: number, y: number, z: number) =>
    o.center
      .clone()
      .addScaledVector(across, x * cosT)
      .addScaledVector(along, z)
      .setY(y);

  const modules: Matrix4[] = [];

  for (let r = 0; r < o.rows; r += 1) {
    const x = -halfX + long * (r + 0.5);

    for (let c = 0; c < o.cols; c += 1) {
      const z = -halfZ + short * (c + 0.5);

      modules.push(moduleMatrix(point(x, roofY(x) + LAYER_Y.module, z), across, along, o.tilt));
    }
  }

  const frame: FrameSet = emptyFrame();
  const postX = spread(o.postsAcross, halfX * 0.8);
  const postZ = spread(o.postsAlong, halfZ * 0.85);

  for (const z of postZ) {
    for (const x of postX) {
      frame.posts.push(beamMatrix(point(x, baseY, z), point(x, roofY(x) - 0.08, z), 0.15, 0.1));
    }

    frame.girders.push(
      beamMatrix(
        point(-halfX, roofY(-halfX) + LAYER_Y.girder, z),
        point(halfX, roofY(halfX) + LAYER_Y.girder, z),
        0.1,
        0.15,
      ),
    );
  }

  for (const x of spread(Math.max(2, o.rows + 1), halfX * 0.92)) {
    frame.purlins.push(
      beamMatrix(point(x, roofY(x) + LAYER_Y.purlin, -halfZ), point(x, roofY(x) + LAYER_Y.purlin, halfZ), 0.075, 0.15),
    );
  }

  return { modules, frame };
}

/** -half ~ half 구간에 n 개를 고르게 (n=1 이면 0) */
export function spread(n: number, half: number): number[] {
  if (n <= 1) return [0];

  return Array.from({ length: n }, (_, i) => -half + (2 * half * i) / (n - 1));
}

export function mergeFrames(target: FrameSet, src: FrameSet) {
  target.posts.push(...src.posts);
  target.girders.push(...src.girders);
  target.purlins.push(...src.purlins);
  target.braces.push(...src.braces);
}

export function emptyFrame(): FrameSet {
  return { posts: [], girders: [], purlins: [], braces: [] };
}

/** 모듈 순서대로 인버터 번호를 장수에 맞춰 배정 */
export function assignSequential(total: number, counts: { no: number; modules: number }[]): number[] {
  const out: number[] = [];

  for (const { no, modules } of counts) {
    for (let i = 0; i < modules && out.length < total; i += 1) out.push(no);
  }

  return out;
}

export const toVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z];

/** 점들을 감싸는 중심·반경 (수평면 기준) */
export function boundsOf(points: Vec3[]): { target: Vector3; radius: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let y = 0;

  for (const [px, py, pz] of points) {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minZ = Math.min(minZ, pz);
    maxZ = Math.max(maxZ, pz);
    y += py;
  }

  if (!Number.isFinite(minX)) return { target: new Vector3(), radius: 1 };

  return {
    target: new Vector3((minX + maxX) / 2, y / points.length, (minZ + maxZ) / 2),
    radius: Math.hypot(maxX - minX, maxZ - minZ) / 2,
  };
}

/** 인스턴스 행렬에서 원점만 뽑는다 — 범위 계산용 */
export const originsOf = (matrices: Matrix4[]): Vec3[] =>
  matrices.map((m) => [m.elements[12], m.elements[13], m.elements[14]]);
