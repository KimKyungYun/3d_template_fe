import { NO_RAYCAST } from '@/hooks/useInstances';
import { Door } from '../Door';
import { box, cylinder, merge, once } from './geometry';
import { CABINET, CABINET_MID_Y, HALF_D, HALF_W, RTU_COLORS } from './layout';

/** 열렸을 때 각도 — 경첩이 오른쪽(+x)이라 문이 앞(+z)으로 열리려면 양수 */
const OPEN_ANGLE = 1.95;
const DOOR_W = CABINET.width - 0.01;
const DOOR_H = CABINET.height - 0.01;
/** 경첩을 원점으로 둔 문 가운데 */
const MID_X = -DOOR_W / 2;

/** 문 테두리와 경첩 배럴 — 한 지오메트리로 */
const frameGeometry = once(() => merge([
  box([DOOR_W, 0.018, 0.016], [MID_X, -DOOR_H / 2 + 0.009, 0.006]),
  box([DOOR_W, 0.018, 0.016], [MID_X, DOOR_H / 2 - 0.009, 0.006]),
  box([0.018, DOOR_H, 0.016], [-0.009, 0, 0.006]),
  box([0.018, DOOR_H, 0.016], [-DOOR_W + 0.009, 0, 0.006]),
  cylinder(0.009, 0.05, [-0.004, DOOR_H / 2 - 0.08, 0.004]),
  cylinder(0.009, 0.05, [-0.004, -DOOR_H / 2 + 0.08, 0.004]),
]));

/** 잠금 장치 — 손잡이 몸통과 레버 */
const lockGeometry = once(() => merge([
  cylinder(0.014, 0.022, [-DOOR_W + 0.014, 0, 0.016], 'z', 10),
  box([0.03, 0.009, 0.008], [-DOOR_W + 0.03, 0, 0.026]),
]));

interface CoverDoorProps {
  unitId: string;
}

/** 투명 커버 문 — 경첩은 오른쪽, 잠금은 왼쪽. 닫혀 있어도 안이 비쳐 보인다 */
export function CoverDoor({ unitId }: CoverDoorProps) {
  return (
    <Door id={`${unitId}:rtu:door`} hinge={[HALF_W, CABINET_MID_Y, HALF_D]} openAngle={OPEN_ANGLE}>
      <mesh position={[MID_X, 0, 0.004]}>
        <boxGeometry args={[DOOR_W - 0.02, DOOR_H - 0.02, 0.004]} />
        <meshStandardMaterial
          color={RTU_COLORS.cover}
          transparent
          opacity={0.3}
          depthWrite={false}
          roughness={0.12}
          metalness={0.05}
        />
      </mesh>
      <mesh geometry={frameGeometry()}>
        <meshStandardMaterial color={RTU_COLORS.frame} roughness={0.55} />
      </mesh>
      <mesh geometry={lockGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={RTU_COLORS.rail} metalness={0.6} roughness={0.4} />
      </mesh>
    </Door>
  );
}
