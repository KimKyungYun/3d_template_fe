import { useMemo } from 'react';
import { Shape, ShapeGeometry } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { GROUND_Y } from '@/plants/builders/scene';
import { HELIPAD, POND } from '@/plants/asiad/siteDetail';

/** 잎 모양 윤곽 (xy 평면, 길이 L·폭 W) */
function leafGeometry(L: number, W: number) {
  const s = new Shape();
  s.moveTo(-L / 2, 0);
  s.quadraticCurveTo(0, W, L / 2, 0);
  s.quadraticCurveTo(0, -W, -L / 2, 0);
  return new ShapeGeometry(s, 24);
}

/** 처음 그릴 때 한 번 만든다 */
let cache: { water: ShapeGeometry; rim: ShapeGeometry } | null = null;

const ponds = () =>
  (cache ??= { water: leafGeometry(POND.length, POND.width), rim: leafGeometry(POND.length + 4, POND.width + 4) });

/** 관람석 북쪽 연못과 원형 헬기장 — 사진 8번의 'H' 표시 착륙장 */
export default function HeliPond() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const pad = HELIPAD;
  const marks = useMemo(
    () => [
      { pos: [-1.6, 0, 0] as const, size: [0.7, 0.04, 5] as const },
      { pos: [1.6, 0, 0] as const, size: [0.7, 0.04, 5] as const },
      { pos: [0, 0, 0] as const, size: [2.5, 0.04, 0.7] as const },
    ],
    [],
  );

  return (
    <group>
      <group position={[POND.center[0], 0, POND.center[2]]} rotation-y={POND.rotY}>
        <mesh
          geometry={ponds().rim}
          rotation-x={-Math.PI / 2}
          position-y={GROUND_Y.site + 0.02}
          receiveShadow
          raycast={NO_RAYCAST}
        >
          <meshStandardMaterial color={colors.concrete} roughness={0.9} />
        </mesh>
        <mesh geometry={ponds().water} rotation-x={-Math.PI / 2} position-y={GROUND_Y.site + 0.08} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={colors.water} roughness={0.12} metalness={0.25} />
        </mesh>
      </group>

      <group position={[pad.center[0], 0, pad.center[2]]}>
        <mesh position-y={pad.height / 2} castShadow receiveShadow raycast={NO_RAYCAST}>
          <cylinderGeometry args={[pad.radius, pad.radius, pad.height, 40]} />
          <meshStandardMaterial color={colors.concrete} roughness={0.85} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={pad.height + 0.02} raycast={NO_RAYCAST}>
          <ringGeometry args={[pad.radius - 1.4, pad.radius - 0.9, 48]} />
          <meshStandardMaterial color={colors.laneWhite} roughness={0.8} />
        </mesh>
        {marks.map((m, i) => (
          <mesh key={i} position={[m.pos[0], pad.height + 0.03, m.pos[2]]} raycast={NO_RAYCAST}>
            <boxGeometry args={m.size} />
            <meshStandardMaterial color={colors.laneWhite} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
