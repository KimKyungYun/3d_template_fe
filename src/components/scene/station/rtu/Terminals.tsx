import { NO_RAYCAST } from '@/hooks/useInstances';
import type { RtuState } from '@/interface/equipment';
import { Part } from '../Part';
import { box, cylinder, merge, once } from './geometry';
import { DC_BLOCK, GROUND_BAR, PANEL_Z, RTU_COLORS } from './layout';
import { dcBlockPart, groundBarPart } from './parts';

const BLOCK_FRONT = PANEL_Z + DC_BLOCK.depth;

/** 단자대 나사 — 위아래 한 줄씩 */
const blockScrewGeometry = once(() => merge(
  [-0.04, -0.016, 0.008, 0.032].flatMap((dx) => [1, -1].map((sy) => (
    cylinder(0.005, 0.01, [DC_BLOCK.x + dx, DC_BLOCK.y + sy * 0.014, BLOCK_FRONT - 0.002], 'z')
  ))),
));

/** 접지 바 나사와 절연 스탠드오프 */
const groundFittingGeometry = once(() => merge([
  ...[-0.04, -0.02, 0, 0.02, 0.04].map((dx) => (
    cylinder(0.005, 0.01, [GROUND_BAR.x + dx, GROUND_BAR.y + GROUND_BAR.size / 2 + 0.003, PANEL_Z + 0.012])
  )),
  ...[-0.045, 0.045].map((dx) => (
    box([0.014, 0.016, 0.014], [GROUND_BAR.x + dx, GROUND_BAR.y - GROUND_BAR.size / 2 - 0.008, PANEL_Z + 0.012])
  )),
]));

interface TerminalsProps {
  unitId: string;
  rtu: RtuState | null;
}

/** 아래쪽 단자 둘 — 오른쪽 DC 12V 단자대, 왼쪽 황동 접지 바 */
export function Terminals({ unitId, rtu }: TerminalsProps) {
  return (
    <>
      <Part info={dcBlockPart(unitId, rtu)}>
        <mesh position={[DC_BLOCK.x, DC_BLOCK.y, PANEL_Z + DC_BLOCK.depth / 2]} castShadow>
          <boxGeometry args={[DC_BLOCK.width, DC_BLOCK.height, DC_BLOCK.depth]} />
          <meshStandardMaterial color={RTU_COLORS.block} roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh geometry={blockScrewGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={RTU_COLORS.screw} metalness={0.75} roughness={0.35} />
        </mesh>
      </Part>
      <Part info={groundBarPart(unitId)}>
        <mesh position={[GROUND_BAR.x, GROUND_BAR.y, PANEL_Z + 0.012]} castShadow>
          <boxGeometry args={[GROUND_BAR.width, GROUND_BAR.size, GROUND_BAR.size]} />
          <meshStandardMaterial color={RTU_COLORS.brass} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh geometry={groundFittingGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={RTU_COLORS.screw} metalness={0.7} roughness={0.4} />
        </mesh>
      </Part>
    </>
  );
}
