import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import InstancedBoxes from '@/components/scene/InstancedBoxes';
import { electricYard } from '@/plants/asiad/siteDetail';
import { SCENE_COLORS, SCENERY_COLORS } from '@/plants/builders/colors';
import type { UnitLayout } from '@/plants/model/types';

interface ElectricYardProps {
  layout: UnitLayout;
}

/** 전기실 둘레 녹색 메시 펜스와 인버터 거치대 위 소형 지붕 (사진 9·12번) */
export default function ElectricYard({ layout }: ElectricYardProps) {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const yard = electricYard(layout);

  return (
    <group>
      <InstancedBoxes matrices={yard.posts}>
        <meshStandardMaterial color={colors.fence} roughness={0.6} />
      </InstancedBoxes>
      <InstancedBoxes matrices={yard.panels}>
        <meshStandardMaterial color={colors.fence} roughness={0.7} transparent opacity={0.35} depthWrite={false} />
      </InstancedBoxes>
      <InstancedBoxes matrices={yard.roofPosts}>
        <meshStandardMaterial color={colors.lampPole} metalness={0.4} roughness={0.5} />
      </InstancedBoxes>
      <InstancedBoxes matrices={[yard.roof]} castShadow>
        <meshStandardMaterial color={SCENE_COLORS[theme].module} metalness={0.35} roughness={0.35} />
      </InstancedBoxes>
    </group>
  );
}
