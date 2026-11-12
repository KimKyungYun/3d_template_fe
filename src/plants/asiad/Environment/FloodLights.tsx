import { useMemo } from 'react';
import { CylinderGeometry, Matrix4, Quaternion, Vector3 } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { FLOOD_HEIGHT, FLOOD_TOWERS } from '@/plants/asiad/siteDetail';
import InstancedBoxes from '@/components/scene/InstancedBoxes';

/** 처음 그릴 때 한 번 만든다 */
let cache: CylinderGeometry | null = null;

const pole = () => (cache ??= new CylinderGeometry(0.35, 0.6, FLOOD_HEIGHT, 10));

// 조명 헤드: 경기장 쪽으로 돌려 아래로 기울인 판 + 등기구 격자
const HEADS = FLOOD_TOWERS.map((t) =>
  new Matrix4().compose(
    new Vector3(t.x, FLOOD_HEIGHT + 1.2, t.z),
    new Quaternion()
      .setFromAxisAngle(new Vector3(0, 1, 0), t.yaw)
      .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.45)),
    new Vector3(6, 3.6, 0.5),
  ),
);
const LAMPS = HEADS.map((m) =>
  m.clone().multiply(new Matrix4().makeTranslation(0, 0, 0.6).scale(new Vector3(0.92, 0.85, 0.4))),
);

/** 보조경기장 네 모서리 조명탑 — 밤에는 등기구가 빛난다 */
export default function FloodLights() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const poles = useMemo(() => FLOOD_TOWERS.map((t) => [t.x, FLOOD_HEIGHT / 2, t.z] as const), []);

  return (
    <group>
      {poles.map((p) => (
        <mesh key={`${p[0]},${p[2]}`} geometry={pole()} position={p} castShadow raycast={NO_RAYCAST}>
          <meshStandardMaterial color={colors.lampPole} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <InstancedBoxes matrices={HEADS} castShadow>
        <meshStandardMaterial color={colors.lampPole} metalness={0.5} roughness={0.5} />
      </InstancedBoxes>
      <InstancedBoxes matrices={LAMPS}>
        <meshStandardMaterial
          color={colors.lampHead}
          emissive={colors.lampHead}
          emissiveIntensity={colors.glow * 1.4}
          toneMapped={colors.glow === 0}
        />
      </InstancedBoxes>
    </group>
  );
}
