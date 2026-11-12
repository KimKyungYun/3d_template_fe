/*
  현장 조치 길잡이 — RTU 함 자리, 인버터 앞 사람 눈높이 시점, 전기실에서 고장 지점까지 걸어가는 길.
  모두 발전소 배치(전기실·인버터·결선 경로)에서 끌어내므로 어느 발전소든 같은 방식으로 선다.
  RTU 함은 도면에 위치가 없어 전기실 옆 「개략」 자리에 둔다.
*/
import type { EquipmentItem, PlantModel, UnitLayout, Vec3 } from '@/plants/model/types';
import { inverterModules } from './strings';

/** 바닥에서 띄우는 높이 — 바닥 띠와 겹쳐 깜빡이지 않게 */
const PATH_Y = 0.35;
/** 사람 눈높이 (m) */
export const EYE_HEIGHT = 1.7;

const RTU_SIZE: Vec3 = [0.8, 1.4, 0.45];

export const rtuId = (unitId: string) => `${unitId}-rtu`;

/** 전기실 옆에 RTU 함을 세운다 — 전기실 로컬 +x 쪽 벽에서 1.2m 떨어진 자리 */
function rtuNextTo(room: EquipmentItem, unitId: string): EquipmentItem {
  const offset = room.size[0] / 2 + 1.2;
  const c = Math.cos(room.rotationY);
  const s = Math.sin(room.rotationY);

  return {
    id: rtuId(unitId),
    kind: 'rtu',
    label: 'RTU 함',
    position: [room.position[0] + c * offset, room.position[1], room.position[2] - s * offset],
    size: RTU_SIZE,
    rotationY: room.rotationY,
    note: 'RS485 수집 · 전력량계·인버터·접속반 (개략 위치)',
  };
}

/** 모델의 호기마다 RTU 함을 붙인다 (이미 있으면 그대로) — 등록소가 모델을 만든 직후 한 번 부른다 */
export function attachRtu(model: PlantModel) {
  for (const unitId of model.unitIds) {
    const layout = model.units[unitId];
    const room = layout.equipment.find((e) => e.kind === 'room');

    if (!room || layout.equipment.some((e) => e.kind === 'rtu')) continue;

    layout.equipment.push(rtuNextTo(room, unitId));
  }
}

const toWorld = (layout: UnitLayout, [x, y, z]: Vec3): Vec3 => [x + layout.origin[0], y + layout.origin[1], z + layout.origin[2]];

/**
 * 설비 랙 자리 (호기 로컬) — 인버터 상자를 바닥으로 내린 점과, 인버터 앞면이 바라보는 방향.
 * 배치마다 상자 크기 축이 달라(얇은 쪽이 x 또는 z) 얇은 축을 앞뒤로 보고 회전을 맞춘다
 */
export function stationFrame(item: EquipmentItem) {
  const thinX = item.size[0] < item.size[2];
  const yaw = item.rotationY + (thinX ? Math.PI / 2 : 0);

  return {
    position: [item.position[0], 0, item.position[2]] as Vec3,
    yaw,
    /** 앞면 법선 (로컬 xz) — 랙 로컬 +z 가 회전된 방향 */
    front: [Math.sin(yaw), Math.cos(yaw)] as [number, number],
  };
}

/** 인버터 상자 자리 (월드) */
export function inverterSpot(model: PlantModel, unitId: string, no: number): Vec3 | null {
  const layout = model.units[unitId];
  const item = layout?.equipment.find((e) => e.kind === 'inverter' && e.inverterNo === no);

  return layout && item ? toWorld(layout, item.position) : null;
}

/**
 * 설비 랙 앞 사람 눈높이 시점 — 인버터 앞면 쪽으로 distance 만큼 떨어져 랙 가운데를 바라본다.
 * 랙 앞면 방향을 모르면(인버터 상자가 없으면) 지금 카메라가 있는 쪽에서 본다. 위치·회전 중심 모두 월드 좌표
 */
export function fieldViewOf(model: PlantModel, unitId: string, no: number, from: Vec3, distance = 3.6) {
  const layout = model.units[unitId];
  const item = layout?.equipment.find((e) => e.kind === 'inverter' && e.inverterNo === no);

  if (!layout || !item) return null;

  const frame = stationFrame(item);
  const spot = toWorld(layout, frame.position);
  let [dx, dz] = frame.front;

  if (!Number.isFinite(dx) || !Number.isFinite(dz)) {
    const len = Math.hypot(from[0] - spot[0], from[2] - spot[2]) || 1;

    dx = (from[0] - spot[0]) / len;
    dz = (from[2] - spot[2]) / len;
  }

  return {
    position: [spot[0] + dx * distance, spot[1] + EYE_HEIGHT, spot[2] + dz * distance] as Vec3,
    target: [spot[0], spot[1] + 1.05, spot[2]] as Vec3,
  };
}

const flatten = (points: Vec3[]): Vec3[] => points.map(([x, , z]) => [x, PATH_Y, z]);

/** 겹치는 점(0.5m 안)을 걸러 낸다 */
const dedupe = (points: Vec3[]) =>
  points.filter((p, i) => i === 0 || Math.hypot(p[0] - points[i - 1][0], p[2] - points[i - 1][2]) > 0.5);

const lengthOf = (points: Vec3[]) =>
  points.reduce((sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p[0] - points[i - 1][0], p[2] - points[i - 1][2])), 0);

/**
 * 찾아가는 길 (호기 로컬) — 전기실에서 인버터까지 교류선을 거슬러 가고,
 * 거기서 케이블 트레이를 따라 가장 먼 모듈 쪽 끝까지 간다. 길은 바닥 높이로 내린다
 */
export function fieldRouteOf(model: PlantModel, unitId: string, no: number) {
  const route = model.wiring[unitId]?.routes.get(no);

  if (!route) return null;

  const toInverter = [...route.ac].reverse();
  // 직류 꺾은선 중 가장 긴 것 — 모듈 쪽에서 전기실 쪽 순서라 뒤집어 인버터 → 모듈로
  const longest = route.dc.reduce<Vec3[]>((best, line) => (lengthOf(line) > lengthOf(best) ? line : best), []);
  let tail: Vec3[] = [...longest].reverse();

  // 트레이 경로가 없는 배치면 인버터에서 그 모듈 묶음 가운데까지 ㄱ자로 걸어간다
  if (tail.length === 0 && toInverter.length > 0) {
    const layout = model.units[unitId];
    const idx = inverterModules(model, unitId, no);

    if (layout && idx.length > 0) {
      let x = 0;
      let z = 0;

      for (const i of idx) {
        x += layout.modules.matrices[i].elements[12];
        z += layout.modules.matrices[i].elements[14];
      }

      x /= idx.length;
      z /= idx.length;

      const last = toInverter[toInverter.length - 1];

      tail = [[last[0], 0, z], [x, 0, z]];
    }
  }

  const points = dedupe(flatten([...toInverter, ...tail]));

  if (points.length < 2) return null;

  return { points, length: lengthOf(points) };
}
