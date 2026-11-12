import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { ACCENT_COLORS, STATUS_COLORS } from '@/configs/status';
import type { RtuDevice } from '@/interface/equipment';
import { Part } from '../Part';
import { cylinder, merge, once } from './geometry';
import { Led } from './Led';
import { PANEL_Z, PORT_Y, RTU_BODY, RTU_COLORS } from './layout';
import { portPart, rtuBodyPart } from './parts';

const FRONT_Z = PANEL_Z + RTU_BODY.depth;
/** 포트 단자 자리 — 본체 왼쪽에 세로로 줄지어 선다 */
const PORT_X = RTU_BODY.x - 0.008;
/** 포트 LED 자리 — 단자 오른쪽 */
const LED_X = RTU_BODY.x + 0.02;

/** 안테나 단자와 짧은 안테나 */
const antennaGeometry = once(() => merge([
  cylinder(0.006, 0.014, [RTU_BODY.x, RTU_BODY.y + RTU_BODY.height / 2 + 0.007, PANEL_Z + 0.025], 'y', 10),
  cylinder(0.0035, 0.09, [RTU_BODY.x, RTU_BODY.y + RTU_BODY.height / 2 + 0.059, PANEL_Z + 0.025], 'y', 8),
]));

interface RtuBodyProps {
  unitId: string;
  devices: RtuDevice[] | null;
}

/** RTU 본체 — DIN 레일형 통신기. 포트 네 구가 각각 부품으로 잡힌다 */
export function RtuBody({ unitId, devices }: RtuBodyProps) {
  const theme = useResolvedTheme();
  const portOf = (port: number) => devices?.find((d) => d.port === port) ?? null;

  return (
    <>
      <Part info={rtuBodyPart(unitId, devices)}>
        <mesh position={[RTU_BODY.x, RTU_BODY.y, PANEL_Z + RTU_BODY.depth / 2]} castShadow>
          <boxGeometry args={[RTU_BODY.width, RTU_BODY.height, RTU_BODY.depth]} />
          <meshStandardMaterial color={RTU_COLORS.rtu} roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[RTU_BODY.x, RTU_BODY.y, FRONT_Z - 0.002]} raycast={NO_RAYCAST}>
          <boxGeometry args={[RTU_BODY.width - 0.012, RTU_BODY.height - 0.02, 0.006]} />
          <meshStandardMaterial color={RTU_COLORS.rtuFace} roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh geometry={antennaGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color="#2b2f33" roughness={0.45} metalness={0.3} />
        </mesh>
      </Part>
      {PORT_Y.map((y, i) => {
        const port = i + 1;
        const device = portOf(port);
        const lost = device?.status === 'lost';

        return (
          <Part key={port} info={portPart(unitId, port, device, devices === null)}>
            <mesh position={[PORT_X, y, FRONT_Z + 0.002]}>
              <boxGeometry args={[0.028, 0.016, 0.012]} />
              <meshStandardMaterial color="#1d2024" roughness={0.5} metalness={0.1} />
            </mesh>
            <Led
              position={[LED_X, y, FRONT_Z + 0.002]}
              color={lost ? STATUS_COLORS[theme].fault : ACCENT_COLORS[theme]}
              mode={lost ? 'blink' : device ? 'steady' : 'off'}
              radius={0.0042}
            />
          </Part>
        );
      })}
    </>
  );
}
