import { BufferGeometry, Float32BufferAttribute, Matrix4, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { beamMatrix } from '@/plants/builders/geometry';
import { ribbonGeometry } from '@/plants/builders/ribbon';
import type { UnitLayout, Vec3 } from '@/plants/model/types';
import { ovalRing, STAND, TRACK } from './layoutUnit2';
import { ASIAD_UNIT1_SECTION } from './spec';

/** 처음 쓸 때 한 번만 계산한다 — 모듈을 불러오는 것만으로 지오메트리를 만들지 않도록 */
function once<T>(make: () => T): () => T {
  let value: T | undefined;
  let done = false;
  return () => {
    if (!done) {
      value = make();
      done = true;
    }
    return value as T;
  };
}

// 태양광 설비 아래·주변의 부지 시설(현장 사진 기준 근사): 관람석·본부석·트랙 라인·조명탑·연못·전기실 펜스·산책로 시설물

const UP = new Vector3(0, 1, 0);
const yawQuat = (yaw: number) => new Quaternion().setFromAxisAngle(UP, yaw);
const box = (pos: Vector3, yaw: number, size: [number, number, number]) =>
  new Matrix4().compose(pos, yawQuat(yaw), new Vector3(...size));

/* ───────────── 보조경기장 관람석 ───────────── */

/** 본부석이 들어서는 서측 직선 구간(|z| < 값)은 관람석 단을 비운다 */
const MAIN_STAND_HALF_Z = 25;

/**
 * 트랙과 나란한 오프셋 타원 위의 점. u(0~1)를 기준 반경 둘레로 나눠 써서
 * 반경이 달라도 같은 u 는 같은 법선 위에 놓인다 (관람석 단이 비틀리지 않게)
 */
function ovalNormalPoint(r: number, u: number): Vector3 {
  const sh = TRACK.straightHalf;
  const arc = Math.PI * TRACK.outerRadius;
  const total = 4 * sh + 2 * arc;
  let s = (((u % 1) + 1) % 1) * total;
  if (s < sh) return new Vector3(-r, 0, -s);
  s -= sh;
  if (s < arc) {
    const phi = (s / arc) * Math.PI;
    return new Vector3(-r * Math.cos(phi), 0, -sh - r * Math.sin(phi));
  }
  s -= arc;
  if (s < 2 * sh) return new Vector3(r, 0, -sh + s);
  s -= 2 * sh;
  if (s < arc) {
    const phi = (s / arc) * Math.PI;
    return new Vector3(r * Math.cos(phi), 0, sh + r * Math.sin(phi));
  }
  s -= arc;
  return new Vector3(-r, 0, sh - s);
}

const STAND_TOTAL = 4 * TRACK.straightHalf + 2 * Math.PI * TRACK.outerRadius;
const U_FROM = MAIN_STAND_HALF_Z / STAND_TOTAL;
const U_TO = 1 - U_FROM;

const SEAT_WIDTH = 0.5;

/** 계단식 관람석 — 디딤판(좌석)과 챌판·뒷벽·양 끝 마감을 따로 만든다 */
function buildStands() {
  const tread: number[] = [];
  const treadUv: number[] = [];
  const riser: number[] = [];
  const samples = 260;
  const depth = (STAND.outer - STAND.inner) / STAND.rows;
  const rise = (STAND.top - STAND.base) / STAND.rows;
  const quad = (out: number[], a: Vector3, b: Vector3, c: Vector3, d: Vector3) => {
    out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
  };
  const at = (r: number, u: number, y: number) => ovalNormalPoint(r, u).setY(y);
  // 좌석 무늬: u 는 둘레 거리 / 좌석 폭, v 는 단 앞(0)→뒤(1)
  const seatU = (r: number, u: number) => (u * (4 * TRACK.straightHalf + 2 * Math.PI * r)) / SEAT_WIDTH;
  const uvQuad = (a: [number, number], b: [number, number], c: [number, number], d: [number, number]) => {
    treadUv.push(...a, ...b, ...c, ...a, ...c, ...d);
  };

  for (let i = 0; i < samples; i += 1) {
    const u0 = U_FROM + ((U_TO - U_FROM) * i) / samples;
    const u1 = U_FROM + ((U_TO - U_FROM) * (i + 1)) / samples;
    for (let k = 0; k < STAND.rows; k += 1) {
      const r0 = STAND.inner + k * depth;
      const r1 = r0 + depth;
      const yLow = STAND.base + k * rise;
      const y = yLow + rise;
      quad(riser, at(r0, u0, k === 0 ? 0 : yLow), at(r0, u0, y), at(r0, u1, y), at(r0, u1, k === 0 ? 0 : yLow));
      quad(tread, at(r0, u0, y), at(r1, u0, y), at(r1, u1, y), at(r0, u1, y));
      const rm = (r0 + r1) / 2;
      uvQuad([seatU(rm, u0), 0], [seatU(rm, u0), 1], [seatU(rm, u1), 1], [seatU(rm, u1), 0]);
    }
    // 바깥 뒷벽
    quad(
      riser,
      at(STAND.outer, u0, STAND.top),
      at(STAND.outer, u0, 0),
      at(STAND.outer, u1, 0),
      at(STAND.outer, u1, STAND.top),
    );
  }
  // 본부석 쪽 양 끝 단면 마감
  for (const u of [U_FROM, U_TO]) {
    for (let k = 0; k < STAND.rows; k += 1) {
      const r0 = STAND.inner + k * depth;
      const y = STAND.base + (k + 1) * rise;
      quad(riser, at(r0, u, 0), at(r0, u, y), at(r0 + depth, u, y), at(r0 + depth, u, 0));
    }
  }

  const make = (arr: number[], uv?: number[]) => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(arr, 3));
    if (uv) g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  };
  return { tread: make(tread, treadUv), riser: make(riser) };
}

export const standGeometry = once(buildStands);

/** 관람석을 오르내리는 통로 계단 (약 22m 간격) */
export const standStairs = once(() => {
  const out: Matrix4[] = [];
  const count = Math.floor(((U_TO - U_FROM) * STAND_TOTAL) / 22);
  for (let i = 0; i <= count; i += 1) {
    const u = U_FROM + 0.004 + ((U_TO - U_FROM - 0.008) * i) / count;
    const a = ovalNormalPoint(STAND.inner, u).setY(STAND.base + 0.12);
    const b = ovalNormalPoint(STAND.outer, u).setY(STAND.top + 0.12);
    out.push(beamMatrix(a, b, 1.5, 0.14));
  }
  return out;
});

/** 서측 본부석 건물 — 1층 기둥 열 + 어두운 안쪽, B타입이 얹히는 앞 지붕(5m)과 C타입이 얹히는 뒤 상단(8m) */
export const MAIN_STAND = {
  front: -50.5,
  back: -64,
  halfZ: 24,
  lowerRoof: 5,
  upperFront: -57,
  upperRoof: 8,
  columns: Array.from({ length: 9 }, (_, i) => -24 + i * 6),
} as const;

/* ───────────── 트랙·필드 라인 ───────────── */

/** 8레인 구분선(9줄)을 한 지오메트리로 */
export const trackLines = once(() => {
  const laneWidth = (TRACK.outerRadius - TRACK.innerRadius) / 8;
  const lines = Array.from({ length: 9 }, (_, k) =>
    ribbonGeometry(ovalRing(TRACK.innerRadius + k * laneWidth), 0.06, 0, true),
  );
  return mergeGeometries(lines)!;
});

/** 결승선 (동측 직선 남쪽 끝) */
export const finishLine = once(() => box(new Vector3((TRACK.innerRadius + TRACK.outerRadius) / 2, 0, TRACK.straightHalf - 4), 0, [
  TRACK.outerRadius - TRACK.innerRadius,
  0.02,
  0.35,
]));

/** 축구장 105×68m 라인 (장축이 남북) */
export const PITCH = { length: 105, width: 68 } as const;

export const pitchLines = once(() => {
  const L = PITCH.length / 2;
  const W = PITCH.width / 2;
  const t = 0.12;
  const line = (x0: number, z0: number, x1: number, z1: number) =>
    beamMatrix(new Vector3(x0, 0, z0), new Vector3(x1, 0, z1), t, 0.02);
  const out = [line(-W, -L, W, -L), line(-W, L, W, L), line(-W, -L, -W, L), line(W, -L, W, L), line(-W, 0, W, 0)];
  for (const s of [-1, 1]) {
    for (const [hw, d] of [
      [20.16, 16.5],
      [9.16, 5.5],
    ]) {
      const zEdge = s * L;
      const zIn = s * (L - d);
      out.push(line(-hw, zEdge, -hw, zIn), line(hw, zEdge, hw, zIn), line(-hw, zIn, hw, zIn));
    }
  }
  return out;
});

/** 축구장 잔디 — 라인 바깥 여유 3m, 줄무늬 한 쌍이 12m (사진 16·17번) */
export const pitchTurf = once(() => ribbonGeometry(
  [
    [0, 0, -PITCH.length / 2 - 3],
    [0, 0, PITCH.length / 2 + 3],
  ],
  PITCH.width + 6,
  0,
  false,
  12,
));

/** 트랙 안 D구역의 멀리뛰기 도움닫기 레인 (양 끝 각 2줄) */
export const runways = once(() => [-1, 1].flatMap((s) =>
  [-7, 7].map((x) => box(new Vector3(x, 0, s * (PITCH.length / 2 + 14)), 0, [1.3, 0.02, 18])),
));

/** 골대: 기둥 2 + 크로스바 (폭 7.32m, 높이 2.44m) */
export const goalPosts = once(() => {
  const out: Matrix4[] = [];
  const hw = 3.66;
  const h = 2.44;
  for (const s of [-1, 1]) {
    const z = s * (PITCH.length / 2 + 0.6);
    out.push(box(new Vector3(-hw, h / 2, z), 0, [0.12, h, 0.12]));
    out.push(box(new Vector3(hw, h / 2, z), 0, [0.12, h, 0.12]));
    out.push(box(new Vector3(0, h, z), 0, [hw * 2 + 0.12, 0.12, 0.12]));
  }
  return out;
});

/* ───────────── 조명탑·연못·헬기장 (보조경기장 로컬 좌표) ───────────── */

/** 2호 배치도(E-11) A링 바깥 네 모서리의 조명탑 기초 표시 자리 */
export const FLOOD_TOWERS = [
  [53, -78],
  [60, 64],
  [-56, -72],
  [-63, 64],
].map(([x, z]) => ({ x, z, yaw: Math.atan2(-x, -z) }));

export const FLOOD_HEIGHT = 35;

/** 북서쪽 잎 모양 연못 — 2호 배치도(E-11)에서 E타입 남동쪽, 둘레에 산책로가 도는 눈 모양 */
export const POND = { center: [-60, 0, -104] as Vec3, length: 52, width: 20, rotY: 0.71 } as const;

/** 연못 안 'H' 원형 헬기장 (배치도의 H 표시 자리) */
export const HELIPAD = { center: [-63, 0, -113] as Vec3, radius: 7.5, height: 0.8 } as const;

/** 연못 둘레 산책로 (눈 모양 고리) */
export const pondPath = once(() => {
  const dir = new Vector3(Math.cos(POND.rotY), 0, -Math.sin(POND.rotY));
  const side = new Vector3(dir.z, 0, -dir.x);
  const L = POND.length / 2 + 9;
  const W = POND.width / 2 + 8;
  const c = new Vector3(...POND.center);
  const pts: Vec3[] = [];
  for (let i = 0; i < 64; i += 1) {
    const t = (i / 64) * Math.PI * 2;
    const p = c
      .clone()
      .addScaledVector(dir, Math.cos(t) * L)
      .addScaledVector(side, Math.sin(t) * W * Math.abs(Math.sin(t)) ** 0.3);
    pts.push([p.x, 0, p.z]);
  }
  return pts;
});

/** 남서쪽 원형 광장과 가운데 조형물 (배치도 오른쪽 아래 원) */
export const ROUND_PLAZA = { center: [-86, 0, 76] as Vec3, radius: 20, core: 6 } as const;

/**
 * 동측 곡선 산책로 — 배치도 위쪽(동쪽)의 겹 원호. 경기장 둘레를 따라 북쪽 끝에서 남쪽 끝까지
 * (서쪽은 본부석·플라자, 북서쪽은 D·E 캐노피라 비운다)
 */
const PROMENADE_RADII = [
  { r: 68, width: 5 },
  { r: 92, width: 4 },
];

export const promenades = once((): { points: Vec3[]; width: number }[] =>
  PROMENADE_RADII.map(({ r, width }) => {
    const sh = TRACK.straightHalf;
    const arc = Math.PI * TRACK.outerRadius;
    const total = 4 * sh + 2 * arc;
    const from = (sh + arc * 0.7) / total;
    const to = (3 * sh + arc * 1.3) / total;
    const points: Vec3[] = [];

    for (let i = 0; i <= 120; i += 1) {
      const p = ovalNormalPoint(r, from + ((to - from) * i) / 120);

      points.push([p.x, 0, p.z]);
    }

    return { points, width };
  }));

/* ───────────── 1호기 캐노피 아래 산책로 ───────────── */

const WALK_STEP = 3;
const BIKE_OFFSET = 2.75;
const BIKE_WIDTH = 3;

export interface WalkwayDetail {
  bikeLane: Vec3[];
  bikeLaneWidth: number;
  bikeDashes: Matrix4[];
  hedges: Matrix4[];
  benches: { seats: Matrix4[]; backs: Matrix4[]; legs: Matrix4[] };
}

/** 산책로 시설물 — 1호기 배치(산책로 중심선·전기실 자리)에서 끌어낸다 */
function buildWalkway(layout: UnitLayout): WalkwayDetail {
  const walkway = layout.ground.ribbons[0]?.points ?? [];
  const walkLength = Math.max(0, (walkway.length - 1) * WALK_STEP);

  /** 산책로 중심선에서 진행 거리 u 의 점·진행·가로 방향 */
  const walkFrame = (u: number) => {
    const f = Math.min(Math.max(u / WALK_STEP, 0), Math.max(0, walkway.length - 1.001));
    const i = Math.floor(f);
    const t = f - i;
    const a = walkway[i] ?? [0, 0, 0];
    const b = walkway[i + 1] ?? a;
    const p = new Vector3(a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t);
    const along = new Vector3(b[0] - a[0], 0, b[2] - a[2]).normalize();
    const across = new Vector3(along.z, 0, -along.x);

    return { p, along, across, yaw: Math.atan2(along.x, along.z) };
  };

  const bikeLane: Vec3[] = Array.from({ length: walkway.length }, (_, i) => {
    const { p, across } = walkFrame(i * WALK_STEP);
    const q = p.addScaledVector(across, BIKE_OFFSET);

    return [q.x, 0, q.z];
  });

  /** 자전거길 가운데 점선 */
  const bikeDashes: Matrix4[] = [];

  for (let u = 2; u + 2 < walkLength; u += 6) {
    const a = walkFrame(u);
    const b = walkFrame(u + 2.5);

    bikeDashes.push(
      beamMatrix(a.p.addScaledVector(a.across, BIKE_OFFSET), b.p.addScaledVector(b.across, BIKE_OFFSET), 0.12, 0.02),
    );
  }

  /** 캐노피 양쪽 기둥열 바깥의 산울타리 — 전기실로 빠지는 트레이 자리는 비운다 */
  const hedges: Matrix4[] = [];
  const edge = (ASIAD_UNIT1_SECTION.crossBayWidth * ASIAD_UNIT1_SECTION.crossBays) / 2 + 1.8;
  // 트레이가 캐노피를 빠져나가는 자리(전기실과 가장 가까운 산책로 지점·쪽)
  const room = layout.equipment.find((e) => e.kind === 'room');
  let branchU = 0;
  let branchSide = 0;

  if (room) {
    let best = Infinity;

    walkway.forEach((p, i) => {
      const d = Math.hypot(p[0] - room.position[0], p[2] - room.position[2]);

      if (d < best) {
        best = d;
        branchU = i * WALK_STEP;
      }
    });

    const bf = walkFrame(branchU);

    branchSide = Math.sign(
      (room.position[0] - bf.p.x) * bf.across.x + (room.position[2] - bf.p.z) * bf.across.z,
    );
  }

  for (let u = 1.5; u < walkLength - 1.5; u += 3.2) {
    for (const side of [-1, 1]) {
      if (side === branchSide && Math.abs(u - branchU) < 5) continue;

      const { p, across, yaw } = walkFrame(u);

      hedges.push(box(p.addScaledVector(across, side * edge).setY(0.6), yaw, [1.1, 0.9, 3]));
    }
  }

  /** 기둥 사이 벤치 — 좌석·등받이·다리 */
  const seats: Matrix4[] = [];
  const backs: Matrix4[] = [];
  const legs: Matrix4[] = [];
  const pitch = ASIAD_UNIT1_SECTION.postPitch;

  for (let k = 1; (k + 0.5) * pitch < walkLength; k += 3) {
    const u = (k + 0.5) * pitch;
    const { p, across, along, yaw } = walkFrame(u);

    for (const side of [-1, 1]) {
      const c = p.clone().addScaledVector(across, side * 8.25);

      seats.push(box(c.clone().setY(0.62), yaw, [0.45, 0.07, 1.8]));
      backs.push(
        box(
          c
            .clone()
            .addScaledVector(across, side * 0.22)
            .setY(0.88),
          yaw,
          [0.06, 0.42, 1.8],
        ),
      );

      for (const s of [-0.75, 0.75]) {
        legs.push(box(c.clone().addScaledVector(along, s).setY(0.38), yaw, [0.42, 0.46, 0.07]));
      }
    }
  }

  return { bikeLane, bikeLaneWidth: BIKE_WIDTH, bikeDashes, hedges, benches: { seats, backs, legs } };
}

const WALKWAYS = new WeakMap<UnitLayout, WalkwayDetail>();

/** 산책로 시설물 — 배치마다 처음 쓸 때 한 번 만든다 */
export function walkwayDetail(layout: UnitLayout): WalkwayDetail {
  let detail = WALKWAYS.get(layout);

  if (!detail) {
    detail = buildWalkway(layout);
    WALKWAYS.set(layout, detail);
  }

  return detail;
}

/* ───────────── 전기실 펜스·인버터 거치대 지붕 ───────────── */

export interface ElectricYard {
  posts: Matrix4[];
  panels: Matrix4[];
  roof: Matrix4;
  roofPosts: Matrix4[];
}

/** 전기실·인버터를 감싸는 녹색 메시 펜스와 인버터 위 소형 지붕 (사진 9·12번) */
function buildYard(layout: UnitLayout): ElectricYard {
  const { equipment } = layout;
  const room = equipment.find((e) => e.kind === 'room');
  const invs = equipment.filter((e) => e.kind === 'inverter');
  const empty: ElectricYard = { posts: [], panels: [], roof: new Matrix4(), roofPosts: [] };

  if (!room || invs.length === 0) return empty;

  const yaw = room.rotationY;
  const xAxis = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const zAxis = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const origin = new Vector3(...room.position).setY(0);
  const toLocal = (p: Vec3) => {
    const d = new Vector3(p[0], 0, p[2]).sub(origin);

    return [d.dot(xAxis), d.dot(zAxis)];
  };
  const toWorld = (x: number, z: number, y: number) =>
    origin.clone().addScaledVector(xAxis, x).addScaledVector(zAxis, z).setY(y);

  const inv = invs.map((e) => toLocal(e.position));
  const ix0 = Math.min(...inv.map((p) => p[0])) - 0.9;
  const ix1 = Math.max(...inv.map((p) => p[0])) + 0.9;
  const iz0 = Math.min(...inv.map((p) => p[1])) - 0.9;
  const iz1 = Math.max(...inv.map((p) => p[1])) + 0.9;
  const x0 = Math.min(-room.size[0] / 2, ix0) - 2.5;
  const x1 = Math.max(room.size[0] / 2, ix1) + 2.5;
  const z0 = Math.min(-room.size[2] / 2, iz0) - 2.5;
  const z1 = Math.max(room.size[2] / 2, iz1) + 2.5;

  const corners: [number, number][] = [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];
  const posts: Matrix4[] = [];
  const panels: Matrix4[] = [];

  corners.forEach(([ax, az], i) => {
    const [bx, bz] = corners[(i + 1) % 4];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 2.5));

    for (let k = 0; k < n; k += 1) {
      const t0 = k / n;
      const t1 = (k + 1) / n;
      const p0 = toWorld(ax + (bx - ax) * t0, az + (bz - az) * t0, 0.95);
      const p1 = toWorld(ax + (bx - ax) * t1, az + (bz - az) * t1, 0.95);

      posts.push(box(p0.clone(), yaw, [0.08, 1.9, 0.08]));
      panels.push(beamMatrix(p0, p1, 0.03, 1.75));
    }
  });

  const roofH = 2.8;
  const roof = box(toWorld((ix0 + ix1) / 2, (iz0 + iz1) / 2, roofH), yaw, [ix1 - ix0, 0.1, iz1 - iz0]);
  const roofPosts = [
    [ix0, iz0],
    [ix1, iz0],
    [ix1, iz1],
    [ix0, iz1],
  ].map(([x, z]) => box(toWorld(x, z, roofH / 2), yaw, [0.1, roofH, 0.1]));

  return { posts, panels, roof, roofPosts };
}

const YARDS = new WeakMap<UnitLayout, ElectricYard>();

/** 전기실 울타리 — 배치마다 처음 쓸 때 한 번 만든다 */
export function electricYard(layout: UnitLayout): ElectricYard {
  let yard = YARDS.get(layout);

  if (!yard) {
    yard = buildYard(layout);
    YARDS.set(layout, yard);
  }

  return yard;
}
