import { DepthSelectionSync } from '@/components/scene/DepthSelectionSync';
import { usePlantScope } from '@/hooks/usePlantScope';
import { buildPath } from '@/routes/buildPath';

/** 고장진단 뎁스 주소와 3D 선택을 맞춘다 */
export function SelectionSync() {
  const { plantId } = usePlantScope();

  if (!plantId) return null;

  return <DepthSelectionSync pathOf={(unitId, no) => buildPath.diagnosis(plantId, unitId, no)} />;
}
