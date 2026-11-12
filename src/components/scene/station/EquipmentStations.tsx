import { stationFrame } from '@/plants/builders/fieldGuide';
import type { Vec3 } from '@/plants/model/types';
import { usePlantModel, useScene } from '../SceneContext';
import { InverterStation } from './InverterStation';
import { NearOnly } from './NearOnly';
import { RtuCabinet } from './RtuCabinet';

/*
  카메라가 이 거리(m) 안에 들어오면 상세 설비를 그린다.
  인버터는 1.3m 간격으로 수십 대가 모여 있어 가까운 몇 대만, RTU 함은 호기에 하나라 넉넉하게 잡는다
*/
const STATION_DISTANCE = 7;
const RTU_DISTANCE = 30;

/** 부품이 목록에서 골라질 때 다가갈 방향을 재는 기준점 표시 */
const STATION_ROOT = { stationRoot: true };

interface EquipmentStationsProps {
  unitId: string;
}

/**
 * 호기의 상세 설비 — 인버터마다 설비 랙(앞: 인버터, 뒤: 접속반 함), 전기실 옆 RTU 함.
 * 가까이 갔을 때만 붙고, 붙어 있는 동안은 단순 상자를 숨긴다. 고른 인버터·현장 시점 대상은 거리와 상관없이 붙는다
 */
export function EquipmentStations({ unitId }: EquipmentStationsProps) {
  const model = usePlantModel();
  const layout = model.units[unitId];
  const fieldView = useScene((s) => s.fieldView);
  const selection = useScene((s) => s.selection);
  const [ox, oy, oz] = layout.origin;
  const world = (p: Vec3): Vec3 => [p[0] + ox, p[1] + oy, p[2] + oz];

  return (
    <>
      {layout.equipment.map((item) => {
        if (item.kind === 'inverter' && item.inverterNo) {
          const frame = stationFrame(item);
          const no = item.inverterNo;

          return (
            <NearOnly
              key={item.id}
              detailKey={`${unitId}:${no}`}
              position={world(frame.position)}
              distance={STATION_DISTANCE}
              // 고른 인버터와 현장 시점 대상은 거리와 상관없이 상세로 그린다
              force={
                (selection?.kind === 'inverter' && selection.unitId === unitId && selection.no === no)
                || (fieldView?.unitId === unitId && fieldView.no === no)
              }
            >
              <group position={frame.position} rotation-y={frame.yaw} userData={STATION_ROOT}>
                <InverterStation unitId={unitId} no={no} />
              </group>
            </NearOnly>
          );
        }

        if (item.kind === 'rtu') {
          return (
            <NearOnly key={item.id} detailKey={`${unitId}:rtu`} position={world(item.position)} distance={RTU_DISTANCE}>
              <group position={[item.position[0], 0, item.position[2]]} rotation-y={item.rotationY} userData={STATION_ROOT}>
                <RtuCabinet unitId={unitId} />
              </group>
            </NearOnly>
          );
        }

        return null;
      })}
    </>
  );
}
