import { useMemo, useRef } from 'react';
import { BoxGeometry, type InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { GROUND_Y } from '@/plants/builders/scene';
import { scenery } from '@/plants/asiad/scenery';
import { NO_RAYCAST, useInstances } from '@/hooks/useInstances';
import { BLOCK_CLIP } from '@/plants/asiad/siteMap';

// 차체 위에 얹는 캐빈(유리) — 차체 행렬에 상대 변환을 곱한다
const CABIN_OFFSET = new Matrix4().compose(
  new Vector3(0, 0.62, -0.08),
  new Quaternion(),
  new Vector3(0.88, 0.62, 0.55),
);

/** 주차장 아스팔트 면과 세워 둔 차량 */
export default function ParkingLots() {
  const theme = useResolvedTheme();
  const site = scenery();
  const colors = SCENERY_COLORS[theme];
  const box = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const bodies = useMemo(() => site.cars.map((c) => c.matrix), [site]);
  const cabins = useMemo(() => site.cars.map((c) => c.matrix.clone().multiply(CABIN_OFFSET)), [site]);
  const bodyColors = useMemo(
    () => site.cars.map((c) => colors.cars[Math.floor(c.tint * colors.cars.length)]),
    [site, colors.cars],
  );
  const bodyRef = useRef<InstancedMesh>(null);
  const cabinRef = useRef<InstancedMesh>(null);
  useInstances(bodyRef, bodies, bodyColors);
  useInstances(cabinRef, cabins);

  return (
    <group>
      {site.parkingLots.map((lot) => (
        <mesh
          key={lot.id}
          position={[lot.center[0], GROUND_Y.parking, lot.center[2]]}
          rotation={[-Math.PI / 2, 0, lot.rotY]}
          receiveShadow
          raycast={NO_RAYCAST}
        >
          <planeGeometry args={lot.size} />
          <meshStandardMaterial clippingPlanes={BLOCK_CLIP} color={colors.asphalt} roughness={0.95} />
        </mesh>
      ))}
      <instancedMesh ref={bodyRef} args={[box, undefined, bodies.length]} raycast={NO_RAYCAST}>
        <meshStandardMaterial clippingPlanes={BLOCK_CLIP} roughness={0.35} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={cabinRef} args={[box, undefined, cabins.length]} raycast={NO_RAYCAST}>
        <meshStandardMaterial clippingPlanes={BLOCK_CLIP} color="#1c232c" roughness={0.15} metalness={0.6} />
      </instancedMesh>
    </group>
  );
}
