import { useMemo } from 'react';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import InstancedBoxes from '@/components/scene/InstancedBoxes';
import { walkwayDetail } from '@/plants/asiad/siteDetail';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { ribbonGeometry } from '@/plants/builders/ribbon';
import { siteRibbonY } from '@/plants/builders/scene';
import { surfaceTexture } from '@/plants/builders/textures';
import type { UnitLayout } from '@/plants/model/types';

// 산책로 포장(0번)·광장(1번) 띠보다 위
const LANE_Y = siteRibbonY('paving', 2);

interface WalkwayUnderProps {
  /** 1호기 배치 — 산책로 중심선과 전기실 자리를 여기서 읽는다 */
  layout: UnitLayout;
}

/** 1호기 캐노피 아래 산책로 — 붉은 자전거길·점선, 기둥열 바깥 산울타리, 기둥 사이 벤치 */
export default function WalkwayUnder({ layout }: WalkwayUnderProps) {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const detail = walkwayDetail(layout);
  const lane = useMemo(
    () => ribbonGeometry(detail.bikeLane, detail.bikeLaneWidth, LANE_Y, false, 1.5),
    [detail],
  );

  return (
    <group>
      <mesh geometry={lane} receiveShadow raycast={NO_RAYCAST}>
        <meshStandardMaterial color={colors.bikePath} map={surfaceTexture('rubber')} roughness={0.9} />
      </mesh>
      <InstancedBoxes matrices={detail.bikeDashes} positionY={LANE_Y + 0.02}>
        <meshStandardMaterial color={colors.laneWhite} roughness={0.8} />
      </InstancedBoxes>
      <InstancedBoxes matrices={detail.hedges} castShadow receiveShadow>
        <meshStandardMaterial color={colors.hedge} roughness={0.95} flatShading />
      </InstancedBoxes>
      <InstancedBoxes matrices={detail.benches.seats}>
        <meshStandardMaterial color={colors.wood} roughness={0.8} />
      </InstancedBoxes>
      <InstancedBoxes matrices={detail.benches.backs}>
        <meshStandardMaterial color={colors.wood} roughness={0.8} />
      </InstancedBoxes>
      <InstancedBoxes matrices={detail.benches.legs}>
        <meshStandardMaterial color={colors.lampPole} metalness={0.4} roughness={0.5} />
      </InstancedBoxes>
    </group>
  );
}
