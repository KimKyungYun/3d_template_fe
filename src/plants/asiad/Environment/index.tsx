import { useScene } from '@/components/scene/SceneContext';
import { siteRibbonY } from '@/plants/builders/scene';
import SkyDome from '@/components/scene/SkyDome';
import type { UnitLayout } from '@/plants/model/types';
import Buildings from './Buildings';
import ElectricYard from './ElectricYard';
import FloodLights from './FloodLights';
import Grandstand from './Grandstand';
import Grounds from './Grounds';
import HeliPond from './HeliPond';
import ParkingLots from './ParkingLots';
import Plazas from './Plazas';
import Roads from './Roads';
import Terrain from './Terrain';
import TrackField from './TrackField';
import WalkwayUnder from './WalkwayUnder';

interface AsiadEnvironmentProps {
  /** 1호기 배치 — 산책로·전기실 울타리를 여기서 끌어낸다 */
  unit1: UnitLayout;
  /** 2호기 배치 */
  unit2: UnitLayout;
}

/**
 * 인천아시아드 주변 — 위성 사진 기준 하늘·받침판·도로·주차장·체육센터와,
 * 태양광 설비 아래·주변 부지 시설(관람석·트랙·조명탑·연못·전기실 펜스·산책로).
 * 관람석·본부석은 A·B·C 가대를 받치는 구조라 늘 보이고, 나머지는 「부지 시설」 레이어로 켜고 끈다
 */
export default function AsiadEnvironment({ unit1, unit2 }: AsiadEnvironmentProps) {
  const visible = useScene((s) => s.layers.details);

  return (
    <>
      <SkyDome />
      <Terrain />
      <Grounds />
      <Roads />
      <ParkingLots />
      <Buildings />

      <group position={unit1.origin}>
        {visible && (
          <>
            <WalkwayUnder layout={unit1} />
            <ElectricYard layout={unit1} />
          </>
        )}
      </group>
      <group position={unit2.origin}>
        <Grandstand />
        {visible && (
          <>
            <TrackField trackY={siteRibbonY('track', 1)} fieldY={siteRibbonY('apron', 0)} />
            <FloodLights />
            <HeliPond />
            <Plazas />
            <ElectricYard layout={unit2} />
          </>
        )}
      </group>
    </>
  );
}
