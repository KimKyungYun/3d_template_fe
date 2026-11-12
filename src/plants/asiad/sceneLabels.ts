/*
  장소 이름표 — 설비 이름표(공용 빌더)에 위성 사진 기준 주변 지물을 더한다.
  위치를 가늠하는 이정표라서 발전소마다 따로 적는다.
*/
import { equipmentLabels } from '@/plants/builders/labels';
import type { PlantGeometry, SceneLabelData } from '@/plants/model/types';
import { SITE } from './siteMap';

export function asiadLabels(model: PlantGeometry): SceneLabelData[] {
  const unitId = model.unitIds[0];
  const landmarks: SceneLabelData[] = [
    {
      key: 'lm-bongsu',
      unitId,
      kind: 'landmark',
      refId: 'bongsu',
      text: '봉수대로',
      position: [SITE.roads[0].points[0][0], 6, SITE.auxStadium[2]],
    },
    {
      key: 'lm-bandabi',
      unitId,
      kind: 'landmark',
      refId: 'bandabi',
      text: SITE.buildings[0].label,
      position: [SITE.buildings[0].center[0], SITE.buildings[0].size[1] + 6, SITE.buildings[0].center[2]],
    },
    {
      key: 'lm-gukje',
      unitId,
      kind: 'landmark',
      refId: 'gukje',
      text: '국제대로',
      position: [SITE.roads[2].points[0][0] + 60, 6, SITE.roads[2].points[0][2]],
    },
  ];

  return [...equipmentLabels(model), ...landmarks];
}
