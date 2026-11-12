import { NO_RAYCAST } from '@/hooks/useInstances';
import { rackGeometry } from './geometry';

/**
 * 아연도금 강관 랙 — 각관 기둥 네 개에 가로대를 걸고 바닥 앞쪽에 케이블 트레이를 답니다.
 * 누를 일 없는 구조물이라 한 덩이로 합쳐 그리고 클릭을 받지 않습니다
 */
export function Rack() {
  return (
    <mesh
      geometry={rackGeometry()}
      raycast={NO_RAYCAST}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#aeb5bb" metalness={0.6} roughness={0.5} />
    </mesh>
  );
}
