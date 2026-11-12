import type { FaultCodeId } from '@/configs/faultCodes';
import type { OperationStatus } from '@/configs/status';

export interface DailyCell {
  /** YYYY-MM-DD */
  date: string;
  /** 진단 효율(%) = 실측 ÷ 예측 발전량, 100 에서 자른다 — null 이면 계측 없음 (0 과 다르다) */
  efficiency: number | null;
  /** null 이면 진단 없음, 0 이면 정상 */
  faultCode: FaultCodeId | null;
}

/** 인버터 아래 단위는 '스트링'이다 (접속반 회로와 1:1) */
export interface StringDiagnosis {
  no: number;
  series: number;
  capacityKw: number;
  status: OperationStatus;
  efficiency: number | null;
  faultCode: FaultCodeId | null;
  daily: DailyCell[];
}

export interface InverterDiagnosis {
  /** 설비 열쇠 — plantId:unitId:no */
  key: string;
  plantId: string;
  unitId: string;
  no: number;
  modules: number;
  capacityKw: number;
  status: OperationStatus;
  efficiency: number | null;
  faultCode: FaultCodeId | null;
  /** 기준 시각 순간 출력 (kW). 통신단절이면 null */
  outputKw: number | null;
  /** 금일 기준 시각까지 예측·실측 발전량 (kWh). 통신단절이면 실측은 null */
  expectedKwh: number;
  actualKwh: number | null;
  /** 기간 중 효율이 주의 기준에 못 미친 날 수 */
  belowDays: number;
  daily: DailyCell[];
  strings: StringDiagnosis[];
}

export type AlertStatus = Exclude<OperationStatus, 'running'>;

/** 이상 설비 — 3D 점등·상시 이름표·이상 피드가 쓴다 */
export interface EquipmentAlert {
  /** 설비 열쇠 — 같은 설비면 스캔이 지나도 같은 값 */
  key: string;
  plantId: string;
  unitId: string;
  no: number;
  /** 이상 스트링 번호 — null 이면 인버터 전체 */
  strings: number[] | null;
  status: AlertStatus;
  /** 카드에 쓰는 이상 이름 — 고장코드 이름이나 '통신단절' */
  label: string;
  faultCode: FaultCodeId | null;
  /** 이상이 시작된 날 (YYYY-MM-DD) */
  since: string;
}
