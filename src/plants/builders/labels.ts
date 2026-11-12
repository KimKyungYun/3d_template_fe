/*
  이름표 DOM 키 규칙과 월드 좌표 계산.
  요소 자체는 씬마다 따로 둔 레지스트리(components/scene/SceneContext)가 들고 있다.
*/
import type { PlantGeometry, Selection, Vec3 } from '@/plants/model/types';
import { inverterModules } from './strings';

/** 선택 카드 DOM 키 */
export const SELECTION_LABEL_KEY = 'selection';

/** 호버 툴팁 DOM 키 */
export const HOVER_LABEL_KEY = 'hover';

/** 나침반 DOM 키 — 위치는 고정이고, 카메라 방향에 맞춰 바늘만 돈다 */
export const COMPASS_KEY = 'compass';

/** 호기 로컬 좌표 → 월드 좌표 */
export function toWorld(model: PlantGeometry, unitId: string, [x, y, z]: Vec3): Vec3 {
  const origin = model.units[unitId]?.origin ?? [0, 0, 0];

  return [x + origin[0], y + origin[1], z + origin[2]];
}

/**
 * 모듈 묶음 위 카드 자리 — 무게중심에 가장 가까운 모듈 위
 * (묶음이 트랙 둘레처럼 흩어져 있으면 무게중심이 빈 가운데로 빠지기 때문)
 */
export function moduleAnchor(model: PlantGeometry, unitId: string, idx: number[]): Vec3 | null {
  const layout = model.units[unitId];

  if (!layout || idx.length === 0) return null;

  const { matrices } = layout.modules;
  let cx = 0;
  let cz = 0;

  for (const i of idx) {
    cx += matrices[i].elements[12];
    cz += matrices[i].elements[14];
  }

  cx /= idx.length;
  cz /= idx.length;

  let best = idx[0];
  let bestD = Infinity;

  for (const i of idx) {
    const d = (matrices[i].elements[12] - cx) ** 2 + (matrices[i].elements[14] - cz) ** 2;

    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }

  const e = matrices[best].elements;

  return toWorld(model, unitId, [e[12], e[13] + 5, e[14]]);
}

/** 선택 카드를 띄울 월드 좌표. 인버터는 모듈 묶음 위에 띄운다 */
export function selectionAnchor(model: PlantGeometry, sel: Selection | null): Vec3 | null {
  if (!sel) return null;

  const layout = model.units[sel.unitId];

  if (!layout) return null;

  if (sel.kind === 'inverter') {
    return moduleAnchor(model, sel.unitId, inverterModules(model, sel.unitId, sel.no));
  }

  if (sel.kind === 'equipment') {
    const item = layout.equipment.find((e) => e.id === sel.id);

    return item
      ? toWorld(model, sel.unitId, [item.position[0], item.position[1] + item.size[1] + 6, item.position[2]])
      : null;
  }

  const tray = layout.trays.find((t) => t.id === sel.id);

  if (!tray) return null;

  const p = tray.points[Math.floor(tray.points.length / 2)];

  return toWorld(model, sel.unitId, [p[0], p[1] + 4, p[2]]);
}

/** 설비 이름표 — 인버터 상자는 수가 많아 빼고, 전기실·한전 설비만 상시 이름을 단다 */
export function equipmentLabels(model: PlantGeometry) {
  return model.unitIds.flatMap((unitId) =>
    (model.units[unitId]?.equipment ?? [])
      .filter((e) => e.kind !== 'inverter')
      .map((e) => ({
        key: `${unitId}-eq-${e.id}`,
        unitId,
        kind: 'equipment' as const,
        refId: e.id,
        text: e.label,
        position: toWorld(model, unitId, [e.position[0], e.position[1] + e.size[1] + 3, e.position[2]]),
      })),
  );
}
