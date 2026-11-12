import { useMemo } from 'react';
import { Shape, ShapeGeometry } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENE_COLORS, SCENERY_COLORS } from '@/plants/builders/colors';
import type { Vec3 } from '@/plants/model/types';
import { ribbonGeometry } from '@/plants/builders/ribbon';
import { GROUND_Y } from '@/plants/builders/scene';
import { type SurfaceKind, surfaceTexture } from '@/plants/builders/textures';
import { BLOCK_CLIP, SITE, type SitePath, type ZoneSurface } from '@/plants/asiad/siteMap';

/** 구역 재질별 질감과 무늬 한 장 크기(m) */
const ZONE_SURFACE: Record<ZoneSurface, { kind: SurfaceKind; tile: number }> = {
  dryLawn: { kind: 'grass', tile: 10 },
  sand: { kind: 'rubber', tile: 6 },
  fairway: { kind: 'stripes', tile: 9 },
  plaza: { kind: 'tile', tile: 4 },
};

const PATH_SURFACE: Record<SitePath['surface'], { kind: SurfaceKind; tile: number }> = {
  paver: { kind: 'paver', tile: 2 },
  dirt: { kind: 'rubber', tile: 2 },
};

/** 다각형 바닥면 — Shape 은 xy 평면이라 z 를 -y 로 넣고 눕힌다. UV 는 평면 좌표 / tile */
function zoneGeometry(points: Vec3[], tile: number) {
  const shape = new Shape();
  points.forEach(([x, , z], i) => (i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z)));
  shape.closePath();
  const g = new ShapeGeometry(shape);
  const uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) / tile, uv.getY(i) / tile);
  return g;
}

/** 1호기 주변 바닥 — 마른 잔디밭·파크골프 모래 코스·페어웨이·체육센터 광장, 포장 산책로와 붉은 흙길 */
export default function Grounds() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const site = SCENE_COLORS[theme];

  // 같은 높이에서 겹치는 구역이 깜빡이지 않게 순서마다 조금씩 띄운다
  const zones = useMemo(
    () =>
      SITE.zones.map((z, i) => ({
        id: z.id,
        surface: z.surface,
        y: GROUND_Y.zone + i * 0.02,
        geometry: zoneGeometry(z.points, ZONE_SURFACE[z.surface].tile),
      })),
    [],
  );
  const paths = useMemo(
    () =>
      SITE.paths.map((p, i) => ({
        id: p.id,
        surface: p.surface,
        geometry: ribbonGeometry(p.points, p.width, GROUND_Y.path + i * 0.01, false, PATH_SURFACE[p.surface].tile),
      })),
    [],
  );
  const zoneColor: Record<ZoneSurface, string> = {
    dryLawn: colors.dryLawn,
    sand: colors.sand,
    fairway: colors.fairway,
    plaza: colors.plaza,
  };

  return (
    <group>
      {zones.map((z) => (
        <mesh
          key={z.id}
          geometry={z.geometry}
          rotation-x={-Math.PI / 2}
          position-y={z.y}
          receiveShadow
          raycast={NO_RAYCAST}
        >
          <meshStandardMaterial
            clippingPlanes={BLOCK_CLIP}
            color={zoneColor[z.surface]}
            map={surfaceTexture(ZONE_SURFACE[z.surface].kind)}
            roughness={1}
          />
        </mesh>
      ))}
      {paths.map((p) => (
        <mesh key={p.id} geometry={p.geometry} receiveShadow raycast={NO_RAYCAST}>
          <meshStandardMaterial
            clippingPlanes={BLOCK_CLIP}
            color={p.surface === 'dirt' ? colors.dirt : site.paving}
            map={surfaceTexture(PATH_SURFACE[p.surface].kind)}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}
