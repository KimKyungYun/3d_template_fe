import { Breaker } from './rtu/Breaker';
import { CoverDoor } from './rtu/CoverDoor';
import { Enclosure } from './rtu/Enclosure';
import { IdModule } from './rtu/IdModule';
import { CABINET_Z, MODULE_SLOTS } from './rtu/layout';
import { PowerMeter } from './rtu/PowerMeter';
import { RtuBody } from './rtu/RtuBody';
import { Terminals } from './rtu/Terminals';
import { Wiring } from './rtu/Wiring';
import { useRtuSubject, useStationData } from './useStationData';

interface RtuCabinetProps {
  unitId: string;
}

/**
 * RTU 함 — 원점은 함을 받치는 각관 기둥 바닥 가운데, 로컬 +z 가 함 앞면(문 쪽).
 * 함 안은 위 왼쪽 4P 차단기 · 위 오른쪽 전력량계 · 가운데 ID 수집 모듈 셋 ·
 * 왼쪽 RTU 본체 · 아래 DC 12V 단자대와 접지 바로, 받은 함 내부 사진과 같은 자리에 선다
 */
export function RtuCabinet({ unitId }: RtuCabinetProps) {
  const no = useRtuSubject(unitId);
  const { equipment } = useStationData(unitId, no);
  const rtu = equipment?.rtu ?? null;
  const devices = rtu?.devices ?? null;

  return (
    <group position={[0, 0, CABINET_Z]}>
      <Enclosure unitId={unitId} rtu={rtu} />
      <Breaker unitId={unitId} />
      <PowerMeter unitId={unitId} device={devices?.find((d) => d.kind === 'meter') ?? null} />
      {MODULE_SLOTS.map((slot) => (
        <IdModule
          key={slot.deviceId}
          unitId={unitId}
          deviceId={slot.deviceId}
          port={slot.port}
          x={slot.x}
          device={devices?.find((d) => d.deviceId === slot.deviceId) ?? null}
        />
      ))}
      <RtuBody unitId={unitId} devices={devices} />
      <Terminals unitId={unitId} rtu={rtu} />
      <Wiring devices={devices} />
      <CoverDoor unitId={unitId} />
    </group>
  );
}
