import { PlantStage } from '@/components/scene/PlantStage';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { ReactNode } from 'react';

interface DiagnosisStageProps {
  /** 3D 위에 겹칠 HUD — 스테이지 루트 안에 있어야 카드·카메라가 패널을 피한다 */
  children: ReactNode;
}

/** 고장진단 3D — 주소의 발전소를 그린다. 고장 점등·10초 스캔·결선 경로를 켠다 */
export function DiagnosisStage({ children }: DiagnosisStageProps) {
  const { plantId } = usePlantScope();

  if (!plantId) return null;

  return <PlantStage plantId={plantId} overlay={children} />;
}
