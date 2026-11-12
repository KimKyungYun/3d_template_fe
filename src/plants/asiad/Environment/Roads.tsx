import { useMemo, useRef } from 'react';
import { BoxGeometry, type InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { ribbonGeometry } from '@/plants/builders/ribbon';
import { GROUND_Y } from '@/plants/builders/scene';
import { scenery } from '@/plants/asiad/scenery';
import type { Strip } from '@/plants/asiad/scenery';
import { surfaceTexture } from '@/plants/builders/textures';
import { NO_RAYCAST, useInstances } from '@/hooks/useInstances';
import { BLOCK_CLIP } from '@/plants/asiad/siteMap';

const LAMP_HEIGHT = 10;
const ARM = 2.2;

/** 가로등 — 처음 그릴 때 한 번 펼친다 (모듈을 불러오는 것만으로 계산하지 않도록) */
let lampCache: { poles: Matrix4[]; heads: Matrix4[] } | null = null;

const lampMatrices = () => {
  if (lampCache) return lampCache;

  const poles: Matrix4[] = [];
  const heads: Matrix4[] = [];
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  for (const l of scenery().lamps) {
    q.setFromAxisAngle(up, l.rotY);
    poles.push(new Matrix4().compose(new Vector3(l.x, LAMP_HEIGHT / 2, l.z), q, new Vector3(0.22, LAMP_HEIGHT, 0.22)));
    const arm = new Vector3(0, 0, ARM).applyQuaternion(q);
    heads.push(
      new Matrix4().compose(new Vector3(l.x + arm.x, LAMP_HEIGHT, l.z + arm.z), q, new Vector3(0.5, 0.22, ARM * 2)),
    );
  }
  lampCache = { poles, heads };

  return lampCache;
};

function StripMeshes({ strips, color, y }: { strips: Strip[]; color: string; y: number }) {
  const geometries = useMemo(() => strips.map((s) => ribbonGeometry(s.points, s.width, y, false, 3)), [strips, y]);
  return (
    <>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow raycast={NO_RAYCAST}>
          <meshStandardMaterial
            clippingPlanes={BLOCK_CLIP}
            color={color}
            map={surfaceTexture('rubber')}
            roughness={0.92}
          />
        </mesh>
      ))}
    </>
  );
}

/** 도로(차선·가로등) — 주차 구획선도 같은 흰 선 인스턴스로 그린다 */
export default function Roads() {
  const site = scenery();
  const lamps = lampMatrices();
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const box = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const whiteRef = useRef<InstancedMesh>(null);
  const yellowRef = useRef<InstancedMesh>(null);
  const poleRef = useRef<InstancedMesh>(null);
  const headRef = useRef<InstancedMesh>(null);
  useInstances(whiteRef, site.laneWhite);
  useInstances(yellowRef, site.laneYellow);
  useInstances(poleRef, lamps.poles);
  useInstances(headRef, lamps.heads);

  return (
    <group>
      <StripMeshes strips={site.roads} color={colors.asphalt} y={GROUND_Y.road} />
      <instancedMesh ref={whiteRef} args={[box, undefined, site.laneWhite.length]} raycast={NO_RAYCAST}>
        <meshStandardMaterial clippingPlanes={BLOCK_CLIP} color={colors.laneWhite} roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={yellowRef} args={[box, undefined, site.laneYellow.length]} raycast={NO_RAYCAST}>
        <meshStandardMaterial clippingPlanes={BLOCK_CLIP} color={colors.laneYellow} roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={poleRef} args={[box, undefined, lamps.poles.length]} raycast={NO_RAYCAST}>
        <meshStandardMaterial clippingPlanes={BLOCK_CLIP} color={colors.lampPole} metalness={0.5} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[box, undefined, lamps.heads.length]} raycast={NO_RAYCAST}>
        <meshStandardMaterial
          clippingPlanes={BLOCK_CLIP}
          color={colors.lampHead}
          emissive={colors.lampHead}
          emissiveIntensity={colors.glow}
          toneMapped={colors.glow === 0}
        />
      </instancedMesh>
    </group>
  );
}
