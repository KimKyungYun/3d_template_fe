import { PlantStage } from '@/components/scene/PlantStage';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { ReactNode } from 'react';

interface StatisticsStageProps {
  /** 3D 위에 겹칠 HUD — 스테이지 루트 안에 있어야 카드·카메라가 패널을 피한다 */
  children: ReactNode;
}

/** 발전통계 3D — 주소의 발전소를 그리고, 주기 스캔·이상 이름표는 끈다(통계 화면은 발전량 색을 본다) */
export function StatisticsStage({ children }: StatisticsStageProps) {
  const { plantId } = usePlantScope();

  if (!plantId) return null;

  return <PlantStage plantId={plantId} showAlerts={false} overlay={children} />;
}
