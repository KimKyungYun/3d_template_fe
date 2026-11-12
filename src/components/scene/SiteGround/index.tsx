import { useMemo } from 'react';
import { Vector3 } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { SCENE_COLORS } from '@/plants/builders/colors';
import { ribbonGeometry } from '@/plants/builders/ribbon';
import { sitePadY, siteRibbonY } from '@/plants/builders/scene';
import { surfaceTexture } from '@/plants/builders/textures';
import type { GroundTone } from '@/plants/model/types';
import type { SurfaceKind } from '@/plants/builders/textures';
import { usePlantModel } from '../SceneContext';

/** 바닥 톤별 질감과 무늬 한 장의 크기(m) */
const SURFACE: Record<GroundTone, { kind: SurfaceKind; scale: number }> = {
  paving: { kind: 'paver', scale: 2 },
  apron: { kind: 'tile', scale: 4 },
  track: { kind: 'rubber', scale: 1.5 },
};

interface SiteGroundProps {
  unitId: string;
}

/** 부지 바닥 — 띠(산책로·트랙·포장)와 가대 아래 포장 패드 */
export default function SiteGround({ unitId }: SiteGroundProps) {
  const model = usePlantModel();
  const theme = useResolvedTheme();
  const { ground } = model.units[unitId];
  const colors = SCENE_COLORS[theme];
  const ribbons = useMemo(
    () =>
      ground.ribbons.map((r, i) => ({
        tone: r.tone,
        geometry: ribbonGeometry(r.points, r.width, siteRibbonY(r.tone, i), r.closed, SURFACE[r.tone].scale),
      })),
    [ground],
  );
  // 패드는 회전된 직사각형이라도 평면 UV 로 블록 무늬가 이어지게 띠로 만든다
  const pads = useMemo(
    () =>
      ground.pads.map((p, i) => {
        const along = new Vector3(Math.sin(p.rotY), 0, Math.cos(p.rotY)).multiplyScalar(p.size[1] / 2);
        const a = new Vector3(...p.center).sub(along);
        const b = new Vector3(...p.center).add(along);

        return ribbonGeometry(
          [
            [a.x, 0, a.z],
            [b.x, 0, b.z],
          ],
          p.size[0],
          sitePadY(i),
          false,
          SURFACE.paving.scale,
        );
      }),
    [ground],
  );

  return (
    <group>
      {ribbons.map((r, i) => (
        <mesh key={i} geometry={r.geometry} receiveShadow>
          <meshStandardMaterial color={colors[r.tone]} map={surfaceTexture(SURFACE[r.tone].kind)} roughness={0.95} />
        </mesh>
      ))}
      {pads.map((g, i) => (
        <mesh key={`p${i}`} geometry={g} receiveShadow>
          <meshStandardMaterial color={colors.paving} map={surfaceTexture('paver')} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
