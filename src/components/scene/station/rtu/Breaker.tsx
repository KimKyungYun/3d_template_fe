import { NO_RAYCAST } from '@/hooks/useInstances';
import { Part } from '../Part';
import { box, cylinder, merge, once } from './geometry';
import { BREAKER, PANEL_Z, RTU_COLORS } from './layout';
import { breakerPart } from './parts';

/** 극마다 하나씩 선 네 자리 */
const POLE_X = [-0.051, -0.017, 0.017, 0.051];
const FRONT_Z = PANEL_Z + BREAKER.depth;

/** 흰 투입 레버 네 개 */
const leverGeometry = once(() => merge(
  POLE_X.map((x) => box([0.022, 0.03, 0.016], [x, BREAKER.y + 0.012, FRONT_Z - 0.004])),
));

/** 위아래 단자 나사 여덟 개 */
const screwGeometry = once(() => merge(
  POLE_X.flatMap((x) => [1, -1].map((sy) => (
    cylinder(0.006, 0.014, [x, BREAKER.y + sy * (BREAKER.height / 2 + 0.005), FRONT_Z - 0.026], 'z')
  ))),
));

interface BreakerProps {
  unitId: string;
}

/** 위 왼쪽 검정 4P 차단기 */
export function Breaker({ unitId }: BreakerProps) {
  return (
    <Part info={breakerPart(unitId)}>
      <mesh position={[BREAKER.x, BREAKER.y, PANEL_Z + BREAKER.depth / 2]} castShadow>
        <boxGeometry args={[BREAKER.width, BREAKER.height, BREAKER.depth]} />
        <meshStandardMaterial color={RTU_COLORS.breaker} roughness={0.45} metalness={0.1} />
      </mesh>
      <group position={[BREAKER.x, 0, 0]}>
        <mesh geometry={leverGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={RTU_COLORS.lever} roughness={0.5} />
        </mesh>
        <mesh geometry={screwGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={RTU_COLORS.screw} metalness={0.75} roughness={0.35} />
        </mesh>
        <mesh position={[0, BREAKER.y - 0.032, FRONT_Z - 0.002]} raycast={NO_RAYCAST}>
          <boxGeometry args={[0.096, 0.028, 0.004]} />
          <meshStandardMaterial color="#d8dbde" roughness={0.6} />
        </mesh>
      </group>
    </Part>
  );
}
