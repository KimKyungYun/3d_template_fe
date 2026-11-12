import type { OperationStatus } from '@/configs/status';
import type { PlantSpec } from '@/plants/types';

/** 발전소 운전 요약 — 홈 목록·KPI 가 쓴다 */
export interface PlantOverview {
  spec: PlantSpec;
  capacityKw: number;
  /** 기준 시각 현재 출력 합 (통신단절 제외) */
  outputKw: number;
  /** 현재 출력 ÷ 설비 용량 */
  outputRatio: number;
  expectedKwh: number;
  actualKwh: number;
  /** 상태별 인버터 대수 */
  statusCount: Record<OperationStatus, number>;
  /** 가장 나쁜 상태 */
  status: OperationStatus;
  alertCount: number;
  /** 마지막 수집 시각 (YYYY-MM-DD HH:mm) */
  gatheredAt: string;
}
