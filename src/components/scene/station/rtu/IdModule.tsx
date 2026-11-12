import { NO_RAYCAST } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { ACCENT_COLORS, STATUS_COLORS } from '@/configs/status';
import type { RtuDevice } from '@/interface/equipment';
import { Part } from '../Part';
import { devicePart } from '../partInfo';
import { box, merge, once } from './geometry';
import { Led } from './Led';
import { MODULE, PANEL_Z, RTU_COLORS } from './layout';
import { pendingDevicePart } from './parts';

const FRONT_Z = PANEL_Z + MODULE.depth;
/** 모듈 위에 얹힌 녹색 PCB 단자 */
const PCB_Y = MODULE.y + MODULE.height / 2 + 0.007;

/** PCB 위 나사 단자 — 되풀이 장식이라 한 덩이로 */
const terminalGeometry = once(() => merge(
  [-0.018, 0, 0.018].map((x) => box([0.009, 0.008, 0.01], [x, PCB_Y + 0.008, PANEL_Z + 0.026])),
));

interface IdModuleProps {
  unitId: string;
  /** 결선도의 ID 번호 */
  deviceId: number;
  /** 물린 RTU 포트 번호 */
  port: number;
  x: number;
  device: RtuDevice | null;
}

/** 흰 ID 수집 모듈 한 개 — 통신단절이면 몸체·PCB 가 상태색으로 바뀌고 앞 LED 가 빨갛게 깜빡인다 */
export function IdModule({ unitId, deviceId, port, x, device }: IdModuleProps) {
  const theme = useResolvedTheme();
  const lost = device?.status === 'lost';
  const bodyColor = lost ? STATUS_COLORS[theme].commLost : RTU_COLORS.module;
  const pcbColor = lost ? STATUS_COLORS[theme].commLost : RTU_COLORS.pcb;

  return (
    <Part info={device ? devicePart(unitId, device) : pendingDevicePart(unitId, deviceId, port)}>
      <mesh position={[x, MODULE.y, PANEL_Z + MODULE.depth / 2]} castShadow>
        <boxGeometry args={[MODULE.width, MODULE.height, MODULE.depth]} />
        <meshStandardMaterial color={bodyColor} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[x, PCB_Y, PANEL_Z + 0.019]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.062, 0.014, 0.03]} />
        <meshStandardMaterial color={pcbColor} roughness={0.6} metalness={0.1} />
      </mesh>
      <group position={[x, 0, 0]}>
        <mesh geometry={terminalGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={RTU_COLORS.screw} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
      <Led
        position={[x - 0.034, MODULE.y + 0.012, FRONT_Z + 0.002]}
        color={lost ? STATUS_COLORS[theme].fault : ACCENT_COLORS[theme]}
        mode={lost ? 'blink' : device ? 'steady' : 'off'}
        radius={0.0045}
      />
    </Part>
  );
}
