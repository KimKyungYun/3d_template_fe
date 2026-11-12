/*
  씬이 보는 운전 상태 한 벌 — 선택 카드·이름표가 같은 값을 말하도록 계산을 여기 모은다.
  상태는 3D 점등과 같은 이상 목록(스토어의 shown)에서, 수치는 진단 조회 결과에서 가져온다.
  진단이 아직 오지 않았으면 빈 상태로 둔다 — 3D 는 데이터보다 먼저 떠야 한다.
*/
import { useMemo } from 'react';
import { STATUS_META } from '@/configs/status';
import { useInverterDiagnosis } from '@/queries/usePlantQueries';
import { alertSignature } from '@/plants/builders/alerts';
import type { OperationStatus } from '@/configs/status';
import type { EquipmentAlert, InverterDiagnosis } from '@/interface/diagnosis';
import { usePlantModel, useScene } from './SceneContext';

/** 인버터 한 대의 지금 운전 상태 */
export interface InverterStatus {
  unitId: string;
  no: number;
  status: OperationStatus;
  /** 이상 이름 — 정상이면 null */
  label: string | null;
  /** 이상 스트링 번호 — null 이면 인버터 전체 (정상이면 의미 없음) */
  strings: number[] | null;
  /** 순간 출력 (kW) — 통신단절이면 null */
  outputKw: number | null;
  expectedKwh: number;
  actualKwh: number | null;
  /** 진단 효율 (%) */
  efficiency: number | null;
  /** 마지막 스캔에서 새로 붙은 이상인지 */
  fresh: boolean;
}

export interface SceneStatus {
  /** 호기 열쇠 → 인버터 상태 (번호 순서) */
  byUnit: Record<string, InverterStatus[]>;
  /** 이상 인버터 — 심한 상태부터, 같으면 호기·번호 순 */
  alerts: InverterStatus[];
  /** 진단 조회가 아직 끝나지 않았는지 */
  pending: boolean;
}

const EMPTY: SceneStatus = { byUnit: {}, alerts: [], pending: true };

function statusOf(
  d: InverterDiagnosis,
  alert: EquipmentAlert | undefined,
  fresh: Set<string>,
): InverterStatus {
  return {
    unitId: d.unitId,
    no: d.no,
    status: alert?.status ?? d.status,
    label: alert?.label ?? null,
    strings: alert?.strings ?? null,
    outputKw: d.outputKw,
    expectedKwh: d.expectedKwh,
    actualKwh: d.actualKwh,
    efficiency: d.efficiency,
    fresh: !!alert && fresh.has(alertSignature(alert)),
  };
}

export function useSceneStatus(): SceneStatus {
  const model = usePlantModel();
  const { data } = useInverterDiagnosis(model.id);
  const shown = useScene((s) => s.alerts.shown);
  const fresh = useScene((s) => s.alerts.fresh);
  const unitIds = model.unitIds;

  return useMemo(() => {
    if (!data) return EMPTY;

    const freshSet = new Set(fresh);
    const byUnit: Record<string, InverterStatus[]> = {};

    for (const unitId of unitIds) {
      byUnit[unitId] = data
        .filter((d) => d.unitId === unitId)
        .map((d) => statusOf(d, shown.find((a) => a.unitId === unitId && a.no === d.no), freshSet));
    }

    const all = unitIds.flatMap((unitId) => byUnit[unitId]);

    return {
      byUnit,
      alerts: all
        .filter((s) => s.status !== 'running')
        .sort(
          (a, b) =>
            STATUS_META[a.status].rank - STATUS_META[b.status].rank ||
            unitIds.indexOf(a.unitId) - unitIds.indexOf(b.unitId) ||
            a.no - b.no,
        ),
      pending: false,
    };
  }, [data, shown, fresh, unitIds]);
}

/** 인버터 한 대의 상태 — 없으면 null */
export const inverterStatusOf = (status: SceneStatus, unitId: string, no: number) =>
  status.byUnit[unitId]?.find((s) => s.no === no) ?? null;
