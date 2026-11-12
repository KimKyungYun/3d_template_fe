import { Matrix4, Quaternion, Vector3 } from 'three';
import { beamMatrix } from '@/plants/builders/geometry';
import { GROUND_Y } from '@/plants/builders/scene';
import type { Vec3 } from '@/plants/model/types';
import { SITE } from './siteMap';
import type { SiteRect } from './siteMap';

// 위성 사진 배치(siteMap)를 바탕으로 발전소 블록 안의 도로 차선·가로등·주차 차량을 펼친다.
// 위치가 정해진 지물은 siteMap 그대로, 차량처럼 수가 많은 것만 시드 고정 난수로 채운다.

export interface Strip {
  points: Vec3[];
  width: number;
}

export interface LampSpot {
  x: number;
  z: number;
  rotY: number;
}

export interface CarSpot {
  matrix: Matrix4;
  /** 0~1, 차 색 고르기 */
  tint: number;
}

export interface Scenery {
  roads: Strip[];
  parkingLots: SiteRect[];
  laneWhite: Matrix4[];
  laneYellow: Matrix4[];
  cars: CarSpot[];
  lamps: LampSpot[];
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 선분 a→b 를 따라 옆으로 offset 만큼 떨어진 실선(gap 0)·점선 */
function lineMarks(a: Vector3, b: Vector3, offset: number, dash: number, gap: number, width = 0.18): Matrix4[] {
  const dir = new Vector3().subVectors(b, a);
  const length = dir.length();
  dir.normalize();
  const side = new Vector3(dir.z, 0, -dir.x).multiplyScalar(offset);
  const y = GROUND_Y.mark;
  if (gap === 0) {
    return [beamMatrix(a.clone().add(side).setY(y), b.clone().add(side).setY(y), width, 0.02)];
  }
  const out: Matrix4[] = [];
  for (let t = 0; t + dash <= length; t += dash + gap) {
    const p0 = a.clone().add(side).addScaledVector(dir, t).setY(y);
    out.push(beamMatrix(p0, p0.clone().addScaledVector(dir, dash), width, 0.02));
  }
  return out;
}

const v3 = (p: Vec3) => new Vector3(p[0], 0, p[2]);

const insideBlock = (x: number, z: number, margin: number) =>
  x > SITE.block.min[0] + margin &&
  x < SITE.block.max[0] - margin &&
  z > SITE.block.min[2] + margin &&
  z < SITE.block.max[2] - margin;

/** 점에서 선분까지 거리 */
function distToSegment(x: number, z: number, a: Vec3, b: Vec3) {
  const vx = b[0] - a[0];
  const vz = b[2] - a[2];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[2]) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(x - (a[0] + vx * t), z - (a[2] + vz * t));
}

/** 다른 도로의 포장면 위인가 */
const onOtherRoad = (id: string, x: number, z: number) =>
  SITE.roads.some(
    (r) => r.id !== id && r.points.slice(1).some((b, i) => distToSegment(x, z, r.points[i], b) < r.width / 2 + 1),
  );

function buildScenery(): Scenery {
  const rand = mulberry32(20241027);
  // 1) 도로: 차선·가로등 — 꺾은선 도로는 구간마다 따로 긋는다
  const laneWhite: Matrix4[] = [];
  const laneYellow: Matrix4[] = [];
  const lamps: LampSpot[] = [];
  const segments = SITE.roads.flatMap((road) =>
    road.points.slice(1).map((b, i) => ({ road, a: v3(road.points[i]), b: v3(b) })),
  );
  for (const { road, a, b } of segments) {
    const half = road.width / 2;
    const laneW = (road.width - 3) / road.lanes;
    for (const k of [-0.22, 0.22]) laneYellow.push(...lineMarks(a, b, k, 0, 0));
    for (let i = 1; i < road.lanes / 2; i += 1) {
      for (const s of [-1, 1]) laneWhite.push(...lineMarks(a, b, s * i * laneW, 5, 7));
    }
    for (const s of [-1, 1]) laneWhite.push(...lineMarks(a, b, s * (half - 0.6), 0, 0));

    const dir = new Vector3().subVectors(b, a);
    const length = dir.length();
    dir.normalize();
    const n = new Vector3(dir.z, 0, -dir.x);
    for (let t = 20; t < length; t += 42) {
      for (const s of [-1, 1]) {
        const p = a
          .clone()
          .addScaledVector(dir, t)
          .addScaledVector(n, s * (half + 1));
        // 받침판 밖이나 다른 도로 위에 서는 가로등은 뺀다
        if (!insideBlock(p.x, p.z, 1) || onOtherRoad(road.id, p.x, p.z)) continue;
        lamps.push({ x: p.x, z: p.z, rotY: Math.atan2(-n.x * s, -n.z * s) });
      }
    }
  }

  // 2) 주차장: 주차 구획선과 차량 (양쪽 주차 5m + 통로 6m 를 한 묶음으로 반복)
  const cars: CarSpot[] = [];
  const up = new Vector3(0, 1, 0);
  for (const lot of SITE.parkingLots) {
    const [w, d] = lot.size;
    const q = new Quaternion().setFromAxisAngle(up, lot.rotY);
    const center = v3(lot.center);
    const local = (x: number, z: number) => new Vector3(x, 0, z).applyQuaternion(q).add(center);
    const stall = 2.6;
    const cols = Math.floor((w - 4) / stall);
    const x0 = -(cols * stall) / 2;
    for (let z = -d / 2 + 2; z + 16 <= d / 2; z += 16) {
      for (const [rowZ, facing] of [
        [z + 2.5, 1],
        [z + 13.5, -1],
      ] as const) {
        for (let c = 0; c <= cols; c += 1) {
          const lx = x0 + c * stall;
          laneWhite.push(
            beamMatrix(
              local(lx, rowZ - 2.5).setY(GROUND_Y.mark),
              local(lx, rowZ + 2.5).setY(GROUND_Y.mark),
              0.12,
              0.02,
            ),
          );
          if (c === cols || rand() > 0.68) continue;
          const pos = local(lx + stall / 2, rowZ + facing * 0.2).setY(0.55);
          const rot = new Quaternion().setFromAxisAngle(
            up,
            lot.rotY + (facing < 0 ? Math.PI : 0) + (rand() - 0.5) * 0.06,
          );
          cars.push({ matrix: new Matrix4().compose(pos, rot, new Vector3(1.8, 0.9, 4.5)), tint: rand() });
        }
      }
    }
  }

  return {
    roads: SITE.roads.map((r) => ({ points: r.points, width: r.width })),
    parkingLots: SITE.parkingLots,
    laneWhite,
    laneYellow,
    cars,
    lamps,
  };
}

/** 처음 쓸 때 한 번 펼친다 — 모듈을 불러오는 것만으로 계산하지 않도록 */
let cache: Scenery | null = null;

export const scenery = (): Scenery => (cache ??= buildScenery());
