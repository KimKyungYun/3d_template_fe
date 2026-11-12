import { DepthSelectionSync } from '@/components/scene/DepthSelectionSync';
import { usePlantScope } from '@/hooks/usePlantScope';
import { buildPath } from '@/routes/buildPath';
import { useStatisticsFilter } from '../hooks/useStatisticsFilter';

/** 발전통계 뎁스 주소와 3D 선택을 맞춘다 — 조회 조건(?period 등)을 그대로 싣고 옮긴다 */
export function SelectionSync() {
  const { plantId } = usePlantScope();
  const { search } = useStatisticsFilter();

  if (!plantId) return null;

  return <DepthSelectionSync pathOf={(unitId, no) => `${buildPath.statistics(plantId, unitId, no)}${search}`} />;
}
