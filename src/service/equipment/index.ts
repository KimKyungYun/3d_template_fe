import { inverterEquipmentOf } from '@/mocks/equipment';
import { delay } from '@/service/delay';
import type { InverterEquipment } from '@/interface/equipment';

/** 인버터에 딸린 RTU 결선·접속반 퓨즈 상태 — 지금은 목. API 가 붙으면 안쪽만 바꾼다 */
export async function getInverterEquipment(plantId: string, unitId: string, no: number): Promise<InverterEquipment | null> {
  await delay(180);

  return inverterEquipmentOf(plantId, unitId, no);
}
