import { useEffect, useMemo } from 'react';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { GROUND_Y } from '@/plants/builders/scene';
import { SITE } from '@/plants/asiad/siteMap';
import { surfaceTexture } from '@/plants/builders/textures';

const THICKNESS = 8;
const TILE = 36;

const { min, max } = SITE.block;
const SIZE_X = max[0] - min[0];
const SIZE_Z = max[2] - min[2];
const CENTER: [number, number, number] = [
  (min[0] + max[0]) / 2,
  GROUND_Y.terrain - THICKNESS / 2,
  (min[2] + max[2]) / 2,
];

/** 발전소 블록만 잘라 낸 받침판 — 윗면은 잔디, 옆면은 흙 */
export default function Terrain() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const texture = useMemo(() => {
    const t = surfaceTexture('grass').clone();
    t.repeat.set(SIZE_X / TILE, SIZE_Z / TILE);
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  // 상자 면 순서: +x, -x, +y(윗면), -y, +z, -z
  return (
    <mesh position={CENTER} receiveShadow raycast={NO_RAYCAST}>
      <boxGeometry args={[SIZE_X, THICKNESS, SIZE_Z]} />
      {[0, 1, 2, 3, 4, 5].map((i) =>
        i === 2 ? (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={colors.grass} map={texture} roughness={1} />
        ) : (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={colors.soil} roughness={1} />
        ),
      )}
    </mesh>
  );
}
