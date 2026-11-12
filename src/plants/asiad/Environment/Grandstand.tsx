import { DoubleSide } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { MAIN_STAND, standGeometry, standStairs } from '@/plants/asiad/siteDetail';
import { surfaceTexture } from '@/plants/builders/textures';
import InstancedBoxes from '@/components/scene/InstancedBoxes';

const M = MAIN_STAND;
const DEPTH = M.front - M.back;
const UPPER_DEPTH = M.upperFront - M.back;

const COLUMNS = M.columns.map((z) => [M.front + 0.6, M.lowerRoof / 2, z] as const);

/** 보조경기장 계단식 관람석과 서측 본부석 건물 (A타입 캐노피 기둥·B·C 모듈이 이 위에 선다) */
export default function Grandstand() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const concrete = <meshStandardMaterial color={colors.concrete} roughness={0.85} />;

  return (
    <group>
      <mesh geometry={standGeometry().tread} castShadow receiveShadow raycast={NO_RAYCAST}>
        <meshStandardMaterial color={colors.seat} map={surfaceTexture('seats')} roughness={0.75} side={DoubleSide} />
      </mesh>
      <mesh geometry={standGeometry().riser} castShadow receiveShadow raycast={NO_RAYCAST}>
        <meshStandardMaterial color={colors.riser} roughness={0.9} side={DoubleSide} />
      </mesh>
      <InstancedBoxes matrices={standStairs()} receiveShadow>
        {concrete}
      </InstancedBoxes>

      {/* 본부석: 안쪽 벽(어두운 개구부) · 앞 지붕 슬래브 · 뒤 상단부 · 1층 기둥 */}
      <mesh position={[M.back + 0.5, M.lowerRoof / 2, 0]} raycast={NO_RAYCAST} receiveShadow>
        <boxGeometry args={[1, M.lowerRoof, M.halfZ * 2]} />
        <meshStandardMaterial color={colors.glass} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[(M.front + M.back) / 2, M.lowerRoof - 0.25, 0]} castShadow receiveShadow raycast={NO_RAYCAST}>
        <boxGeometry args={[DEPTH, 0.5, M.halfZ * 2 + 1]} />
        {concrete}
      </mesh>
      <mesh
        position={[(M.upperFront + M.back) / 2, (M.lowerRoof + M.upperRoof) / 2, 0]}
        castShadow
        receiveShadow
        raycast={NO_RAYCAST}
      >
        <boxGeometry args={[UPPER_DEPTH, M.upperRoof - M.lowerRoof, M.halfZ * 2]} />
        {concrete}
      </mesh>
      {COLUMNS.map(([x, y, z]) => (
        <mesh key={z} position={[x, y, z]} castShadow raycast={NO_RAYCAST}>
          <boxGeometry args={[0.5, M.lowerRoof - 0.5, 0.5]} />
          {concrete}
        </mesh>
      ))}
    </group>
  );
}
