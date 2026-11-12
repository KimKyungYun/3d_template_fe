import { useScene } from '@/components/scene/SceneContext';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useInverterEquipment } from '@/queries/useEquipmentQueries';
import { useInverterDiagnosis } from '@/queries/usePlantQueries';

/** 인버터 뎁스 조각들이 나눠 쓰는 값 — 진단 한 대, RTU·접속반, 3D 스캔이 잡은 이상 */
export function useInverterScope() {
  const { plantId, spec, unitId, no } = usePlantScope();
  const diagnosis = useInverterDiagnosis(plantId ?? '');
  const equipment = useInverterEquipment(plantId ?? '', unitId ?? '', no ?? 0);
  const alert = useScene((s) => s.alerts.shown.find((a) => a.unitId === unitId && a.no === no) ?? null);
  const diag = diagnosis.data?.find((d) => d.unitId === unitId && d.no === no) ?? null;
  const unit = spec?.units.find((u) => u.id === unitId);

  return {
    plantId: plantId ?? '',
    unitId: unitId ?? '',
    no: no ?? 0,
    unit,
    multiUnit: (spec?.units.length ?? 0) > 1,
    diag,
    equipment: equipment.data ?? null,
    alert,
  };
}
