import { STATUS_META, STATUS_ORDER } from '@/configs/status';
import { alertsOf, inverterDiagnosisOf, REFERENCE_DATE, REFERENCE_TIME } from '@/mocks/plantState';
import { getPlantSpec, PLANT_SPECS } from '@/plants/catalog';
import { round1 } from '@/mocks/random';
import { delay } from '@/service/delay';
import type { OperationStatus } from '@/configs/status';
import type { EquipmentAlert, InverterDiagnosis } from '@/interface/diagnosis';
import type { PlantOverview } from '@/interface/plant';

/*
  발전소 조회 — 지금은 목데이터(mocks/plantState)를 돌려준다.
  실제 API 를 붙일 때는 각 함수 안쪽만 axios 호출로 바꾼다. 반환 모양은 그대로 둔다.
*/

export const countByStatus = (items: { status: OperationStatus }[]) =>
  STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: items.filter((i) => i.status === s).length }),
    {} as Record<OperationStatus, number>,
  );

function overviewOf(plantId: string): PlantOverview | null {
  const spec = getPlantSpec(plantId);

  if (!spec) return null;

  const inverters = inverterDiagnosisOf(plantId);
  const capacityKw = round1(inverters.reduce((sum, i) => sum + i.capacityKw, 0));
  const outputKw = round1(inverters.reduce((sum, i) => sum + (i.outputKw ?? 0), 0));
  const statusCount = countByStatus(inverters);
  const status = STATUS_ORDER.find((s) => statusCount[s] > 0 && STATUS_META[s].rank < 3) ?? 'running';

  return {
    spec,
    capacityKw,
    outputKw,
    outputRatio: capacityKw ? outputKw / capacityKw : 0,
    expectedKwh: round1(inverters.reduce((sum, i) => sum + i.expectedKwh, 0)),
    actualKwh: round1(inverters.reduce((sum, i) => sum + (i.actualKwh ?? 0), 0)),
    statusCount,
    status,
    alertCount: alertsOf(plantId).length,
    gatheredAt: `${REFERENCE_DATE} ${REFERENCE_TIME}`,
  };
}

export async function getPlantOverviews(): Promise<PlantOverview[]> {
  await delay();

  return PLANT_SPECS.map((spec) => overviewOf(spec.id)).filter((o): o is PlantOverview => o !== null);
}

export async function getInverterDiagnosis(plantId: string): Promise<InverterDiagnosis[]> {
  await delay();

  return inverterDiagnosisOf(plantId);
}

/** 이상 설비 — 3D 스캔이 끝날 때마다 다시 읽는다 */
export async function getAlerts(plantId: string): Promise<EquipmentAlert[]> {
  await delay(120);

  return alertsOf(plantId);
}
