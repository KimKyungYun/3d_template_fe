import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENE_COLORS, SCENERY_COLORS } from '@/plants/builders/colors';
import type { Vec3 } from '@/plants/model/types';
import { finishLine, goalPosts, pitchLines, pitchTurf, runways, trackLines } from '@/plants/asiad/siteDetail';
import { surfaceTexture } from '@/plants/builders/textures';
import InstancedBoxes from '@/components/scene/InstancedBoxes';

interface TrackFieldProps {
  position?: Vec3;
  /** 트랙 띠 윗면 높이 */
  trackY: number;
  /** 필드 띠 윗면 높이 */
  fieldY: number;
}

/** 400m 트랙 8레인 라인·결승선, 줄무늬 축구장 잔디·라인·골대, D구역 도움닫기 레인 */
export default function TrackField({ position = [0, 0, 0], trackY, fieldY }: TrackFieldProps) {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const site = SCENE_COLORS[theme];
  const lineColor = colors.laneWhite;

  return (
    <group position={position}>
      <group position-y={trackY + 0.015}>
        <mesh geometry={trackLines()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={lineColor} roughness={0.8} />
        </mesh>
        <InstancedBoxes matrices={[finishLine()]}>
          <meshStandardMaterial color={lineColor} roughness={0.8} />
        </InstancedBoxes>
      </group>
      <mesh geometry={pitchTurf()} position-y={fieldY + 0.012} receiveShadow raycast={NO_RAYCAST}>
        <meshStandardMaterial color={site.field} map={surfaceTexture('stripes')} roughness={1} />
      </mesh>
      <InstancedBoxes matrices={runways()} positionY={fieldY + 0.012}>
        <meshStandardMaterial color={site.track} map={surfaceTexture('rubber')} roughness={0.9} />
      </InstancedBoxes>
      <group position-y={fieldY + 0.03}>
        <InstancedBoxes matrices={pitchLines()}>
          <meshStandardMaterial color={lineColor} roughness={0.8} />
        </InstancedBoxes>
        <mesh rotation-x={-Math.PI / 2} raycast={NO_RAYCAST}>
          <ringGeometry args={[9.09, 9.21, 64]} />
          <meshStandardMaterial color={lineColor} roughness={0.8} />
        </mesh>
        <InstancedBoxes matrices={goalPosts()} castShadow>
          <meshStandardMaterial color="#f4f4f2" roughness={0.5} />
        </InstancedBoxes>
      </group>
    </group>
  );
}
