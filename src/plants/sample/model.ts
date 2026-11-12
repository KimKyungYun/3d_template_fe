/*
  평지형 샘플 3D 모델 — 발전소를 새로 등록하는 길을 보이는 가장 단순한 모델.
  spec.ts 의 규격 몇 줄과 layout.ts 하나면 3D 가 선다.
*/
import { scanRangeOf } from '@/plants/builders/alerts';
import { overviewOf } from '@/plants/builders/camera';
import { equipmentLabels } from '@/plants/builders/labels';
import { buildWiring } from '@/plants/builders/wiring';
import type { FocusSpot, PlantGeometry, PlantModel } from '@/plants/model/types';
import { buildSampleLayout } from './layout';
import { SAMPLE_MODULE_SIZE, SAMPLE_SPEC } from './spec';
import SampleEnvironment from './Environment';

export function buildSampleModel(): PlantModel {
  const layout = buildSampleLayout();
  const geometry: PlantGeometry = {
    spec: SAMPLE_SPEC,
    unitIds: [layout.unitId],
    units: { [layout.unitId]: layout },
  };
  // 호기 원점이 0 이라 로컬 포커스가 그대로 월드 좌표다
  const focus: FocusSpot = layout.focus;
  const unitFocus = { [layout.unitId]: focus };

  return {
    ...geometry,
    id: SAMPLE_SPEC.id,
    moduleSize: SAMPLE_MODULE_SIZE,
    wiring: buildWiring(geometry),
    labels: equipmentLabels(geometry),
    scanRange: scanRangeOf(geometry),
    overview: overviewOf([focus]),
    unitFocus,
    Environment: SampleEnvironment,
  };
}
