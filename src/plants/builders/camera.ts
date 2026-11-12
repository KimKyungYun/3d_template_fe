/*
  카메라 자리 계산. 캔버스가 숨겨져 있거나 막 붙은 순간에는 크기가 0 이라 aspect 가 NaN·Infinity 가 되는데,
  그대로 쓰면 카메라 좌표가 NaN 으로 물들어 아무것도 그려지지 않는다 — 들어오는 수를 모두 유한수로 거른다.
*/
import { Vector3 } from 'three';
import type { FocusSpot, PlantModel, Selection, Vec3 } from '@/plants/model/types';
import { boundsOf, originsOf } from './geometry';
import { inverterModules } from './strings';

const VIEW_DIR = new Vector3(0.55, 0.78, 0.95).normalize();

const FOV = 38;

export const CAMERA_FOV = FOV;

/** 전체 보기 열쇠 — 그 밖의 뷰 값은 호기 열쇠다 */
export const VIEW_ALL = 'all';

/** 아주 작은 대상도 주변이 보이게 하는 반경 하한 (m) */
const MIN_RADIUS = 10;

const safeAspect = (aspect: number) => (Number.isFinite(aspect) && aspect > 0.01 ? aspect : 1);

export const isFiniteVec = (v: Vector3) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

/** 반경 radius 인 구가 화면에 꽉 차는 카메라 거리 — 세로·가로 화각 중 좁은 쪽 기준 (세로 화면 대응) */
export function fitDistance(radius: number, aspect: number) {
  const halfV = ((FOV / 2) * Math.PI) / 180;
  const half = Math.min(halfV, Math.atan(Math.tan(halfV) * safeAspect(aspect)));
  const r = Number.isFinite(radius) && radius > 0 ? radius : MIN_RADIUS;

  return r / Math.tan(half);
}

const spotToVector = (spot: FocusSpot) => new Vector3(spot.target[0], 0, spot.target[2]);

/** 뷰(전체·호기)의 회전 중심과 카메라 자리 */
export function goalOf(model: PlantModel, view: string, aspect: number) {
  const spot = model.unitFocus[view] ?? model.overview;
  const target = spotToVector(spot);
  const position = target.clone().addScaledVector(VIEW_DIR, fitDistance(spot.radius, aspect));

  return { target, position };
}

/** 선택 대상을 화면에 담을 회전 중심·반경 (월드 좌표) */
export function focusOf(model: PlantModel, sel: Selection): { target: Vector3; radius: number } {
  const layout = model.units[sel.unitId];

  if (!layout) return { target: spotToVector(model.overview), radius: model.overview.radius };

  const [ox, oy, oz] = layout.origin;
  let local: { target: Vector3; radius: number };

  if (sel.kind === 'inverter') {
    const idx = inverterModules(model, sel.unitId, sel.no);

    local = boundsOf(originsOf(idx.map((i) => layout.modules.matrices[i])));
  } else if (sel.kind === 'equipment') {
    const item = layout.equipment.find((e) => e.id === sel.id);

    local = item
      ? { target: new Vector3(...item.position), radius: Math.max(...item.size) * 2 }
      : { target: new Vector3(), radius: MIN_RADIUS };
  } else {
    const tray = layout.trays.find((t) => t.id === sel.id);

    local = boundsOf(tray?.points ?? []);
  }

  return { target: local.target.add(new Vector3(ox, oy, oz)), radius: Math.max(local.radius * 1.15, MIN_RADIUS) };
}

/** 첫 카메라 자리 — 캔버스 크기를 아직 모르므로 창 비율로 잡는다 */
export const initialCamera = (model: PlantModel) =>
  goalOf(model, VIEW_ALL, window.innerWidth / Math.max(1, window.innerHeight));

/** 첫 진입 연출 시작 자리 — 시작 시점보다 2.4배 멀고, 왼쪽으로 50° 돌아간 높은 하늘 */
export function introPosition(start: { position: Vector3; target: Vector3 }) {
  const offset = start.position.clone().sub(start.target).multiplyScalar(2.4);

  offset.applyAxisAngle(new Vector3(0, 1, 0), (-50 * Math.PI) / 180);
  offset.y *= 1.4;

  return start.target.clone().add(offset);
}

/** 모든 호기를 담는 전체 보기 범위 */
export function overviewOf(spots: FocusSpot[]): FocusSpot {
  if (spots.length === 0) return { target: [0, 0, 0], radius: 100 };
  if (spots.length === 1) return spots[0];

  const center: Vec3 = [
    spots.reduce((s, f) => s + f.target[0], 0) / spots.length,
    0,
    spots.reduce((s, f) => s + f.target[2], 0) / spots.length,
  ];
  const radius = Math.max(
    ...spots.map((f) => Math.hypot(f.target[0] - center[0], f.target[2] - center[2]) + f.radius),
  );

  return { target: center, radius };
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
