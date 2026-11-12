import { Vector3 } from 'three';
import { assignSequential, buildTable, emptyFrame, mergeFrames, pitchLong, pitchShort, toVec3 } from '@/plants/builders/geometry';
import type { TableOptions } from '@/plants/builders/geometry';
import type { EquipmentItem, GroundPad, TrayRoute, UnitLayout, Vec3 } from '@/plants/model/types';
import { ASIAD_MODULE_SPEC, ASIAD_SPEC, ASIAD_UNIT2_TYPES } from './spec';
import { SITE } from './siteMap';
import type { Matrix4 } from 'three';
import type { AsiadUnit2TypeId } from './spec';

const MODULE_PITCH_LONG = pitchLong(ASIAD_MODULE_SPEC);
const MODULE_PITCH_SHORT = pitchShort(ASIAD_MODULE_SPEC);

// 보조경기장 400m 트랙 (트랙 중심이 원점, 장축이 남북 = z 축)
export const TRACK = {
  straightHalf: 42.195,
  innerRadius: 36.5,
  outerRadius: 46.26,
  /** A타입 1열형 포스트 캐노피가 놓이는 관람석 뒷줄 링 반경 */
  ringRadius: 57.5,
} as const;

/** 계단식 관람석 — 트랙 바깥 가장자리에서 바깥으로 올라간다 (사진 기준 근사) */
export const STAND = { inner: 48.5, outer: 59.5, rows: 9, base: 0.4, top: 3.6 } as const;

/** 관람석 반경 r 위치의 디딤판 높이 */
export function standHeightAt(r: number): number {
  const depth = (STAND.outer - STAND.inner) / STAND.rows;
  const k = Math.min(STAND.rows - 1, Math.max(0, Math.floor((r - STAND.inner) / depth)));
  return STAND.base + ((k + 1) * (STAND.top - STAND.base)) / STAND.rows;
}

const A_POST_HEIGHT = 3;

/** 현장 사진에서 가늠한 가대 경사 (A 12°, 본부석 B·C 15°, D 10°, E 8°) */
const deg = (v: number) => (v * Math.PI) / 180;
const A_GAP_HALF = 28;

/** 오프셋 타원의 둘레 위치(서측 직선 중앙에서 북쪽으로 출발) → 점 */
export function ovalPoint(r: number, d: number): Vector3 {
  const sh = TRACK.straightHalf;
  const arc = Math.PI * r;
  const perimeter = 4 * sh + 2 * arc;
  let t = ((d % perimeter) + perimeter) % perimeter;
  if (t < sh) return new Vector3(-r, 0, -t);
  t -= sh;
  if (t < arc) {
    const phi = t / r;
    return new Vector3(-r * Math.cos(phi), 0, -sh - r * Math.sin(phi));
  }
  t -= arc;
  if (t < 2 * sh) return new Vector3(r, 0, -sh + t);
  t -= 2 * sh;
  if (t < arc) {
    const phi = t / r;
    return new Vector3(r * Math.cos(phi), 0, sh + r * Math.sin(phi));
  }
  t -= arc;
  return new Vector3(-r, 0, sh - t);
}

export const ovalPerimeter = (r: number) => 4 * TRACK.straightHalf + 2 * Math.PI * r;

export function ovalRing(r: number): Vec3[] {
  const p = ovalPerimeter(r);
  const n = Math.ceil(p / 2);
  return Array.from({ length: n }, (_, i) => toVec3(ovalPoint(r, (p * i) / n)));
}

interface TypedTable extends TableOptions {
  type: AsiadUnit2TypeId;
}

function trackTables(): TypedTable[] {
  const r = TRACK.ringRadius;
  const p = ovalPerimeter(r);
  const count = ASIAD_UNIT2_TYPES.A.modules / 12;
  const pitch = (p - 2 * A_GAP_HALF) / count;
  return Array.from({ length: count }, (_, i) => {
    const d = A_GAP_HALF + pitch * (i + 0.5);
    const a = ovalPoint(r, d - 0.5);
    const b = ovalPoint(r, d + 0.5);
    const yaw = Math.atan2(b.x - a.x, b.z - a.z);
    return {
      type: 'A',
      center: ovalPoint(r, d),
      yaw,
      rows: 2,
      cols: 6,
      tilt: deg(12),
      postHeight: A_POST_HEIGHT,
      postsAlong: 2,
      postsAcross: 1,
      baseY: standHeightAt(TRACK.ringRadius),
    };
  });
}

function standTables(): TypedTable[] {
  const zs = [-13.5, -4.5, 4.5, 13.5];
  const b: TypedTable[] = zs.map((z) => ({
    type: 'B',
    center: new Vector3(-53.5, 0, z),
    yaw: 0,
    rows: 3,
    cols: 4,
    tilt: -deg(15),
    postHeight: 1.3,
    postsAlong: 2,
    postsAcross: 2,
    baseY: 5,
  }));
  const c: TypedTable[] = zs.map((z) => ({
    type: 'C',
    center: new Vector3(-60.5, 0, z),
    yaw: 0,
    rows: 2,
    cols: 7,
    tilt: -deg(15),
    postHeight: 1.2,
    postsAlong: 2,
    postsAcross: 2,
    baseY: 8,
  }));
  return [...b, ...c];
}

function plazaTables(): TypedTable[] {
  // 다이나믹 플라자: 동서 방향 띠 21줄 × 15장, 띠마다 경사를 엇갈림
  return Array.from({ length: 21 }, (_, i) => ({
    type: 'F',
    center: new Vector3(-88, 0, (i - 10) * 1.4),
    yaw: 0,
    rows: 15,
    cols: 1,
    tilt: i % 2 === 0 ? 0.05 : -0.05,
    postHeight: 4.5,
    postsAlong: 1,
    postsAcross: 2,
  }));
}

function canopyTables(): TypedTable[] {
  const d: TypedTable[] = [-107, -115.5, -124, -132.5, -141].map((z) => ({
    type: 'D',
    center: new Vector3(-15, 0, z),
    yaw: 0,
    rows: 6,
    cols: 7,
    tilt: deg(10),
    postHeight: 3.5,
    postsAlong: 2,
    postsAcross: 2,
  }));
  const e: TypedTable[] = [
    {
      type: 'E',
      center: new Vector3(-44, 0, -152),
      yaw: Math.PI / 4,
      rows: 8,
      cols: 25,
      tilt: deg(8),
      postHeight: 3.8,
      postsAlong: 4,
      postsAcross: 3,
    },
    {
      type: 'E',
      center: new Vector3(-66, 0, -132),
      yaw: 0,
      rows: 6,
      cols: 20,
      tilt: deg(8),
      postHeight: 3.5,
      postsAlong: 4,
      postsAcross: 2,
    },
    {
      type: 'E',
      center: new Vector3(-78.5, 0, -132),
      yaw: 0,
      rows: 4,
      cols: 30,
      tilt: deg(8),
      postHeight: 3.5,
      postsAlong: 5,
      postsAcross: 2,
    },
  ];
  return [...d, ...e];
}

/** 가대들의 바닥 투영 범위를 감싸는 포장면 (모두 같은 방위각이면 그 방향으로 정렬) */
function padOf(group: TableOptions[], margin = 1.5): GroundPad {
  const yaw = group[0].yaw;
  const along = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const across = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const t of group) {
    const hx = ((t.rows * MODULE_PITCH_LONG) / 2) * Math.cos(t.tilt);
    const hz = (t.cols * MODULE_PITCH_SHORT) / 2;
    const cx = t.center.dot(across);
    const cz = t.center.dot(along);
    minX = Math.min(minX, cx - hx);
    maxX = Math.max(maxX, cx + hx);
    minZ = Math.min(minZ, cz - hz);
    maxZ = Math.max(maxZ, cz + hz);
  }
  const mx = (minX + maxX) / 2;
  const mz = (minZ + maxZ) / 2;
  const c = across.clone().multiplyScalar(mx).addScaledVector(along, mz);
  return { center: [c.x, 0, c.z], size: [maxX - minX + margin * 2, maxZ - minZ + margin * 2], rotY: yaw };
}

export function buildUnit2Layout(): UnitLayout {
  const spec = ASIAD_SPEC.units[1];
  // 인버터 배정 순서: 구역 A(트랙 → 본부석 → 플라자) → 구역 C(E타입), D타입은 INV#6(14직렬×15병렬=210장) 단독
  const order: AsiadUnit2TypeId[] = ['A', 'B', 'C', 'F', 'E', 'D'];
  const tables = [...trackTables(), ...standTables(), ...plazaTables(), ...canopyTables()];
  const frame = emptyFrame();
  const byType = new Map<AsiadUnit2TypeId, Matrix4[]>(order.map((t) => [t, []]));
  for (const t of tables) {
    const r = buildTable(t, ASIAD_MODULE_SPEC);
    byType.get(t.type)!.push(...r.modules);
    mergeFrames(frame, r.frame);
  }

  const matrices: Matrix4[] = [];
  const types: AsiadUnit2TypeId[] = [];
  for (const t of order) {
    const list = byType.get(t)!;
    matrices.push(...list);
    types.push(...list.map(() => t));
  }
  const inv6 = spec.inverters.find((v) => v.no === 6)!;
  const others = spec.inverters.filter((v) => v.no !== 6);
  const dCount = byType.get('D')!.length;
  const inverter = [...assignSequential(matrices.length - dCount, others), ...assignSequential(dCount, [inv6])];
  const zone = types.map((t) => (t === 'D' ? 'B' : t === 'E' ? 'C' : 'A'));

  // D·E·F 캐노피 아래 포장: 가까이 붙은 동은 한 장으로 묶고, 돌아간 E1 은 따로
  const pads: GroundPad[] = [
    padOf(tables.filter((t) => t.type === 'D')),
    padOf(tables.filter((t) => t.type === 'F')),
    padOf(tables.filter((t) => t.type === 'E' && t.yaw !== 0)),
    padOf(tables.filter((t) => t.type === 'E' && t.yaw === 0)),
  ];

  // 덕트·트레이
  const ductY = standHeightAt(TRACK.ringRadius) + A_POST_HEIGHT - 0.25;
  const p = ovalPerimeter(TRACK.ringRadius);
  const ring: Vec3[] = [];
  for (let d = A_GAP_HALF; d <= p - A_GAP_HALF; d += 3) ring.push(toVec3(ovalPoint(TRACK.ringRadius, d).setY(ductY)));
  const room = new Vector3(30, 0, -114);
  const ringNearRoom = new Vector3(30, 0, -TRACK.straightHalf - Math.sqrt(TRACK.ringRadius ** 2 - 30 ** 2));
  const ringWest = ovalPoint(TRACK.ringRadius, A_GAP_HALF);

  const trays: TrayRoute[] = [
    { id: 'u2-ring', label: '1열형 포스트 상부 덕트 (A)', points: ring, zones: ['A'] },
    {
      id: 'u2-room-ring',
      label: '전기실–트랙 연결 덕트',
      points: [
        [room.x, 0.3, room.z + 3],
        [ringNearRoom.x, 0.3, ringNearRoom.z - 3],
        [ringNearRoom.x, ductY, ringNearRoom.z],
      ],
    },
    {
      id: 'u2-stand',
      label: '관람석–전기실 연결 덕트 (B·C·F)',
      zones: ['A'],
      points: [
        [ringWest.x, ductY, ringWest.z],
        [-53.5, 5.6, -20],
        [-60.5, 8.6, -20],
        [-60.5, 8.6, -16],
        [-74, 5, -16],
        [-74, 5, 16],
      ],
    },
    {
      id: 'u2-d',
      label: 'D타입 연결 덕트',
      zones: ['B'],
      points: [
        [room.x - 5, 0.3, room.z],
        [-8, 0.3, room.z],
        [-8, 0.3, -107],
      ],
    },
    {
      id: 'u2-e',
      label: 'E타입 연결 덕트',
      zones: ['C'],
      points: [
        [room.x, 0.3, room.z - 3],
        [room.x, 0.3, -168],
        [-30, 0.3, -168],
        [-38, 0.3, -160],
      ],
    },
  ];

  const equipment: EquipmentItem[] = [
    { id: 'u2-room', kind: 'room', label: '2호 전기실', position: toVec3(room), size: [10, 3, 5], rotationY: 0 },
  ];
  spec.inverters.forEach((inv, i) => {
    equipment.push({
      id: `u2-inv-${inv.no}`,
      kind: 'inverter',
      label: `INV #${inv.no}`,
      position: [room.x - 5.2 + i * 1.3, 0.79, room.z + 5],
      size: [0.95, 0.779, 0.3625],
      rotationY: 0,
      inverterNo: inv.no,
    });
  });

  return {
    unitId: spec.id,
    origin: SITE.auxStadium,
    modules: { matrices, inverter, zone },
    frame,
    trays,
    equipment,
    ground: {
      ribbons: [
        // 트랙 안쪽(D구역 포함)은 회색 타일, 축구장 잔디는 부지 시설에서 직사각형으로 얹는다
        { points: ovalRing(TRACK.innerRadius / 2), width: TRACK.innerRadius, tone: 'apron', closed: true },
        {
          points: ovalRing((TRACK.innerRadius + TRACK.outerRadius) / 2),
          width: TRACK.outerRadius - TRACK.innerRadius,
          tone: 'track',
          closed: true,
        },
        // 트랙 바깥 가장자리 ~ 관람석 첫 단 사이 타일 띠
        {
          points: ovalRing((TRACK.outerRadius + STAND.inner) / 2),
          width: STAND.inner - TRACK.outerRadius,
          tone: 'apron',
          closed: true,
        },
      ],
      pads,
    },
    focus: { target: [-15, 0, -35], radius: 135 },
  };
}
