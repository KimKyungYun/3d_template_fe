import { useInverterEquipment } from '@/queries/useEquipmentQueries';
import { useInverterDiagnosis } from '@/queries/usePlantQueries';
import type { InverterEquipment } from '@/interface/equipment';
import type { InverterDiagnosis } from '@/interface/diagnosis';
import { usePlantModel, useScene } from '../SceneContext';

export interface StationData {
  diag: InverterDiagnosis | null;
  equipment: InverterEquipment | null;
}

/** 설비 랙 한 벌의 데이터 — 인버터 진단과 접속반·RTU 상태 (상세 모델이 붙을 때만 조회한다) */
export function useStationData(unitId: string, no: number): StationData {
  const model = usePlantModel();
  const diagnosis = useInverterDiagnosis(model.id);
  const equipment = useInverterEquipment(model.id, unitId, no);

  return {
    diag: diagnosis.data?.find((d) => d.unitId === unitId && d.no === no) ?? null,
    equipment: equipment.data ?? null,
  };
}

/**
 * 호기 RTU 함이 보여 줄 인버터 — RTU 결선 더미는 인버터 한 대 기준이라,
 * 그 호기에서 고른 인버터, 없으면 통신단절 인버터, 없으면 첫 인버터를 기준으로 삼는다
 */
export function useRtuSubject(unitId: string): number {
  const model = usePlantModel();
  const diagnosis = useInverterDiagnosis(model.id);
  const selection = useScene((s) => s.selection);

  if (selection?.kind === 'inverter' && selection.unitId === unitId) return selection.no;

  const list = diagnosis.data?.filter((d) => d.unitId === unitId) ?? [];

  return (list.find((d) => d.status === 'commLost') ?? list[0])?.no ?? 1;
}
