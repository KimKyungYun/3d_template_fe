import { PlantStage } from '@/components/scene/PlantStage';
import { usePlantId } from '@/stores/plantStore';
import type { ReactNode } from 'react';

interface HomeStageProps {
  /** 3D 위에 겹칠 HUD — 스테이지 루트 안에 들어가야 카드·카메라가 패널을 피한다 */
  children: ReactNode;
}

/** 홈 가운데 3D — 왼쪽 목록에서 고른 발전소를 그린다 */
export function HomeStage({ children }: HomeStageProps) {
  const plantId = usePlantId();

  return <PlantStage plantId={plantId} overlay={children} />;
}
