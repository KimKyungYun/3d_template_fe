import { useMemo } from 'react';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import InstancedBoxes from '@/components/scene/InstancedBoxes';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { GROUND_Y } from '@/plants/builders/scene';
import { surfaceTexture } from '@/plants/builders/textures';
import { SAMPLE_SITE } from '@/plants/sample/layout';
import SkyDome from '@/components/scene/SkyDome';

/** 받침판 — 부지 바깥까지 넉넉히 */
const GROUND = { width: 620, depth: 620 } as const;
/** 울타리 기둥 간격 (m) */
const FENCE_PITCH = 4;
const FENCE_HEIGHT = 2.1;

const UP = new Vector3(0, 1, 0);
const post = (x: number, z: number, size: [number, number, number]) =>
  new Matrix4().compose(new Vector3(x, size[1] / 2, z), new Quaternion().setFromAxisAngle(UP, 0), new Vector3(...size));

/** 부지를 두르는 울타리 — 기둥과 그 사이 메시 판 */
function buildFence() {
  const hw = SAMPLE_SITE.width / 2;
  const hd = SAMPLE_SITE.depth / 2;
  const cz = SAMPLE_SITE.centerZ;
  const posts: Matrix4[] = [];
  const panels: Matrix4[] = [];

  for (const side of [-1, 1]) {
    for (let x = -hw; x <= hw; x += FENCE_PITCH) {
      posts.push(post(x, cz + side * hd, [0.1, FENCE_HEIGHT, 0.1]));
    }

    for (let z = -hd; z <= hd; z += FENCE_PITCH) {
      posts.push(post(side * hw, cz + z, [0.1, FENCE_HEIGHT, 0.1]));
    }

    panels.push(post(0, cz + side * hd, [hw * 2, FENCE_HEIGHT - 0.2, 0.04]));
    panels.push(post(side * hw, cz, [0.04, FENCE_HEIGHT - 0.2, hd * 2]));
  }

  return { posts, panels };
}

/** 평지 샘플 주변 — 잔디 받침판, 부지 자갈 바닥, 둘레 울타리, 공용 하늘 */
export default function SampleEnvironment() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const fence = useMemo(() => buildFence(), []);

  return (
    <>
      <SkyDome />
      <mesh
        position={[0, GROUND_Y.terrain, SAMPLE_SITE.centerZ]}
        rotation-x={-Math.PI / 2}
        receiveShadow
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[GROUND.width, GROUND.depth]} />
        <meshStandardMaterial color={colors.grass} map={surfaceTexture('grass')} roughness={0.95} />
      </mesh>
      <mesh
        position={[0, GROUND_Y.zone, SAMPLE_SITE.centerZ]}
        rotation-x={-Math.PI / 2}
        receiveShadow
        raycast={NO_RAYCAST}
      >
        <planeGeometry args={[SAMPLE_SITE.width, SAMPLE_SITE.depth]} />
        <meshStandardMaterial color={colors.sand} map={surfaceTexture('rubber')} roughness={0.98} />
      </mesh>
      <InstancedBoxes matrices={fence.posts} castShadow>
        <meshStandardMaterial color={colors.lampPole} metalness={0.4} roughness={0.5} />
      </InstancedBoxes>
      <InstancedBoxes matrices={fence.panels}>
        <meshStandardMaterial color={colors.fence} roughness={0.7} transparent opacity={0.3} depthWrite={false} />
      </InstancedBoxes>
    </>
  );
}
