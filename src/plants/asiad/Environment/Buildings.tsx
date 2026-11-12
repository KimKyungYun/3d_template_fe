import { useMemo } from 'react';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENE_COLORS, SCENERY_COLORS } from '@/plants/builders/colors';
import { SITE } from '@/plants/asiad/siteMap';
import InstancedBoxes from '@/components/scene/InstancedBoxes';

const PANEL_ROW = { depth: 1.9, pitch: 2.6, margin: 1.6, tilt: 0.17 } as const;
const CARPORT_POST_PITCH = 6;

/** 옥상 태양광 패널 열 — 건물 방위에 맞춰 깔고, 열마다 남쪽으로 살짝 기울인다 */
function roofPanels(): Matrix4[] {
  const out: Matrix4[] = [];
  for (const b of SITE.buildings) {
    if (!b.roofPanels) continue;
    const [w, h, d] = b.size;
    const rows = Math.floor((d - PANEL_ROW.margin * 2) / PANEL_ROW.pitch);
    const q = new Quaternion().setFromEuler(new Euler(PANEL_ROW.tilt, b.rotY, 0, 'YXZ'));
    const yawQ = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), b.rotY);
    for (let r = 0; r < rows; r += 1) {
      const lz = -d / 2 + PANEL_ROW.margin + PANEL_ROW.pitch * (r + 0.5);
      const pos = new Vector3(0, 0, lz).applyQuaternion(yawQ).add(new Vector3(b.center[0], h + 0.55, b.center[2]));
      out.push(new Matrix4().compose(pos, q, new Vector3(w - PANEL_ROW.margin * 2, 0.06, PANEL_ROW.depth)));
    }
  }
  return out;
}

/** 카포트: 가운데 기둥 열 + 태양광 지붕 */
function carports() {
  const posts: Matrix4[] = [];
  const roofs: Matrix4[] = [];
  const q = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.06);
  for (const c of SITE.carports) {
    const [w, d] = c.size;
    roofs.push(new Matrix4().compose(new Vector3(c.center[0], c.height, c.center[2]), q, new Vector3(w, 0.12, d)));
    const n = Math.max(2, Math.round(d / CARPORT_POST_PITCH));
    for (let i = 0; i <= n; i += 1) {
      const z = c.center[2] - d / 2 + (d * i) / n;
      posts.push(
        new Matrix4().compose(
          new Vector3(c.center[0], c.height / 2, z),
          new Quaternion(),
          new Vector3(0.18, c.height, 0.18),
        ),
      );
    }
  }
  return { posts, roofs };
}

/** 처음 그릴 때 한 번 펼친다 — 모듈을 불러오는 것만으로 계산하지 않도록 */
let cache: { panels: Matrix4[]; carports: ReturnType<typeof carports> } | null = null;

const parts = () => (cache ??= { panels: roofPanels(), carports: carports() });

/** 인천반다비체육센터 — 본동·날개동·로비, 커튼월 띠, 옥상 태양광 열과 주차장 카포트 */
export default function Buildings() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const site = SCENE_COLORS[theme];
  const masses = useMemo(
    () =>
      SITE.buildings.map((b) => ({
        ...b,
        // 1층 위 커튼월 띠
        band: [b.size[0] + 0.12, Math.min(2.4, b.size[1] * 0.25), b.size[2] + 0.12] as [number, number, number],
      })),
    [],
  );

  return (
    <group>
      {masses.map((b) => (
        <group key={b.id} position={[b.center[0], 0, b.center[2]]} rotation-y={b.rotY}>
          <mesh position-y={b.size[1] / 2} castShadow receiveShadow raycast={NO_RAYCAST}>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={colors.building} roughness={0.8} />
          </mesh>
          <mesh position-y={b.size[1] * 0.55} raycast={NO_RAYCAST}>
            <boxGeometry args={b.band} />
            <meshStandardMaterial color={colors.glass} roughness={0.25} metalness={0.5} />
          </mesh>
          <mesh position-y={b.size[1] + 0.3} raycast={NO_RAYCAST}>
            <boxGeometry args={[b.size[0] + 0.3, 0.6, b.size[2] + 0.3]} />
            <meshStandardMaterial color={colors.concrete} roughness={0.85} />
          </mesh>
        </group>
      ))}
      <InstancedBoxes matrices={parts().panels} castShadow>
        <meshStandardMaterial color={site.module} metalness={0.35} roughness={0.35} />
      </InstancedBoxes>
      <InstancedBoxes matrices={parts().carports.posts}>
        <meshStandardMaterial color={colors.lampPole} metalness={0.4} roughness={0.5} />
      </InstancedBoxes>
      <InstancedBoxes matrices={parts().carports.roofs} castShadow>
        <meshStandardMaterial color={site.module} metalness={0.35} roughness={0.35} />
      </InstancedBoxes>
    </group>
  );
}
