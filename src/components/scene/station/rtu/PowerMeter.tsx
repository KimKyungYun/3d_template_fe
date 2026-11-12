import { useEffect, useMemo } from 'react';
import { NO_RAYCAST } from '@/hooks/useInstances';
import type { RtuDevice } from '@/interface/equipment';
import { Part } from '../Part';
import { box, cylinder, merge, once } from './geometry';
import { METER, METER_READING, PANEL_Z, RTU_COLORS } from './layout';
import { meterPart } from './parts';
import { makeMeterDisplayTexture } from './textures';

const FRONT_Z = PANEL_Z + METER.depth;

/** 위아래 단자 덮개 */
const coverGeometry = once(() => merge([
  box([METER.width - 0.016, 0.03, 0.05], [METER.x, METER.y + METER.height / 2 - 0.012, PANEL_Z + 0.025]),
  box([METER.width - 0.016, 0.034, 0.05], [METER.x, METER.y - METER.height / 2 + 0.014, PANEL_Z + 0.025]),
]));

/** 둥근 투명 창 테 */
const bezelGeometry = once(() => cylinder(0.05, 0.012, [METER.x, METER.y, FRONT_Z - 0.004], 'z', 24));

interface PowerMeterProps {
  unitId: string;
  device: RtuDevice | null;
}

/** 위 오른쪽 회색 전력량계 — 둥근 창 안에 kWh 지침을 그린다 */
export function PowerMeter({ unitId, device }: PowerMeterProps) {
  const display = useMemo(() => makeMeterDisplayTexture(METER_READING), []);

  useEffect(() => () => display.dispose(), [display]);

  return (
    <Part info={meterPart(unitId, METER_READING, device)}>
      <mesh position={[METER.x, METER.y, PANEL_Z + METER.depth / 2]} castShadow>
        <boxGeometry args={[METER.width, METER.height, METER.depth]} />
        <meshStandardMaterial color={RTU_COLORS.meter} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh geometry={coverGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#cdd2d6" roughness={0.6} />
      </mesh>
      <mesh geometry={bezelGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#9aa2a9" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[METER.x, METER.y, FRONT_Z + 0.003]} raycast={NO_RAYCAST}>
        <circleGeometry args={[0.045, 28]} />
        <meshStandardMaterial map={display} roughness={0.25} metalness={0} />
      </mesh>
    </Part>
  );
}
