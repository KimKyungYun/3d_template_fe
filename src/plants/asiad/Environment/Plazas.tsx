import { useMemo } from 'react';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENE_COLORS, SCENERY_COLORS } from '@/plants/builders/colors';
import { ribbonGeometry } from '@/plants/builders/ribbon';
import { GROUND_Y } from '@/plants/builders/scene';
import { pondPath, promenades, ROUND_PLAZA } from '@/plants/asiad/siteDetail';
import { surfaceTexture } from '@/plants/builders/textures';

const PATH_Y = GROUND_Y.site + 0.02;

/** 보조경기장 둘레 포장 — 동측 겹 곡선 산책로, 연못 둘레 산책로, 남서쪽 원형 광장과 조형물 */
export default function Plazas() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const site = SCENE_COLORS[theme];
  const paths = useMemo(
    () => [
      ...promenades().map((p) => ribbonGeometry(p.points, p.width, PATH_Y, false, 2)),
      ribbonGeometry(pondPath(), 4, PATH_Y, true, 2),
    ],
    [],
  );
  const paver = surfaceTexture('paver');
  const { center, radius, core } = ROUND_PLAZA;

  return (
    <group>
      {paths.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow raycast={NO_RAYCAST}>
          <meshStandardMaterial color={site.paving} map={paver} roughness={0.95} />
        </mesh>
      ))}
      <group position={center}>
        <mesh rotation-x={-Math.PI / 2} position-y={PATH_Y} receiveShadow raycast={NO_RAYCAST}>
          <circleGeometry args={[radius, 64]} />
          <meshStandardMaterial color={site.paving} map={paver} roughness={0.95} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={PATH_Y + 0.02} raycast={NO_RAYCAST}>
          <ringGeometry args={[core + 2, core + 3.2, 64]} />
          <meshStandardMaterial color={colors.hedge} roughness={0.95} />
        </mesh>
        <mesh position-y={0.6} castShadow receiveShadow raycast={NO_RAYCAST}>
          <cylinderGeometry args={[core, core, 1.2, 48]} />
          <meshStandardMaterial color={colors.concrete} roughness={0.8} />
        </mesh>
        <mesh position-y={2.6} castShadow raycast={NO_RAYCAST}>
          <cylinderGeometry args={[0.6, 1.2, 2.8, 16]} />
          <meshStandardMaterial color={colors.glass} roughness={0.4} metalness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
