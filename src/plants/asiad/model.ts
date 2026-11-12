/*
  인천아시아드 3D 모델. plants/registry.ts 가 처음 쓸 때 한 번 부른다 —
  여기서 비로소 가대·결선·부지 시설이 계산된다.
*/
import { createElement } from 'react';
import { overviewOf } from '@/plants/builders/camera';
import { scanRangeOf } from '@/plants/builders/alerts';
import { buildWiring } from '@/plants/builders/wiring';
import type { FocusSpot, PlantGeometry, PlantModel, UnitLayout } from '@/plants/model/types';
import { ASIAD_MODULE_SPEC, ASIAD_SPEC } from './spec';
import { buildUnit1Layout } from './layoutUnit1';
import { buildUnit2Layout } from './layoutUnit2';
import { asiadLabels } from './sceneLabels';
import AsiadEnvironment from './Environment';

/** 호기 로컬 포커스를 월드 좌표로 */
const worldFocus = (layout: UnitLayout): FocusSpot => ({
  target: [
    layout.focus.target[0] + layout.origin[0],
    layout.focus.target[1] + layout.origin[1],
    layout.focus.target[2] + layout.origin[2],
  ],
  radius: layout.focus.radius,
});

export function buildAsiadModel(): PlantModel {
  const unit1 = buildUnit1Layout();
  const unit2 = buildUnit2Layout();
  const units: Record<string, UnitLayout> = { [unit1.unitId]: unit1, [unit2.unitId]: unit2 };
  const geometry: PlantGeometry = {
    spec: ASIAD_SPEC,
    unitIds: ASIAD_SPEC.units.map((u) => u.id),
    units,
  };
  const unitFocus = Object.fromEntries(geometry.unitIds.map((id) => [id, worldFocus(units[id])]));

  return {
    ...geometry,
    id: ASIAD_SPEC.id,
    moduleSize: ASIAD_MODULE_SPEC,
    wiring: buildWiring(geometry),
    labels: asiadLabels(geometry),
    scanRange: scanRangeOf(geometry),
    overview: overviewOf(Object.values(unitFocus)),
    unitFocus,
    // 주변 환경은 이 배치에서 끌어낸 시설물을 쓰므로 모델을 만들 때 묶어 둔다
    Environment: () => createElement(AsiadEnvironment, { unit1, unit2 }),
  };
}
