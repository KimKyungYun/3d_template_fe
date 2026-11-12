/** 출력 곡선 한 점 — 10분 간격 */
export interface OutputPoint {
  /** HH:mm */
  time: string;
  /** 소수 시 */
  hour: number;
  /** 예측 출력 (kW) */
  expectedKw: number;
  /** 실측 출력 (kW) — 기준 시각 뒤는 null */
  actualKw: number | null;
}

export interface OutputSeries {
  plantId: string;
  date: string;
  /** 기준 시각 (HH:mm) — 실측이 여기까지 있다 */
  until: string;
  capacityKw: number;
  points: OutputPoint[];
}

export type StatPeriod = 'day' | 'month' | 'year';

/** 통계 한 칸 — 일: 시간, 월: 날, 년: 달 */
export interface StatBucket {
  /** 축 이름 — '13시', '11.09', '11월' */
  label: string;
  /** 칸 열쇠 — 시(0~23)·날(YYYY-MM-DD)·달(YYYY-MM) */
  key: string;
  actualKwh: number | null;
  expectedKwh: number;
  /** 일사량 (kWh/㎡) */
  irradiance: number;
}

/** 인버터 한 대의 기간 통계 */
export interface InverterStat {
  key: string;
  unitId: string;
  no: number;
  capacityKw: number;
  actualKwh: number;
  expectedKwh: number;
  /** 기대 대비 발전률 (0~1.1) — 계측이 없으면 null */
  ratio: number | null;
  /** 칸마다 실측 (스크러버·스파크라인) */
  buckets: (number | null)[];
}

export interface GenerationStats {
  plantId: string;
  period: StatPeriod;
  /** 기준 날짜 YYYY-MM-DD */
  date: string;
  /** 화면 머리에 쓰는 기간 이름 — '2026.11.09', '2026.11', '2026' */
  rangeLabel: string;
  capacityKw: number;
  buckets: StatBucket[];
  inverters: InverterStat[];
  totals: {
    actualKwh: number;
    expectedKwh: number;
    /** 기대 대비 달성률 */
    achievement: number;
    /** 발전시간 (h) = 발전량 ÷ 설비용량 */
    hours: number;
    /** 이용률 CF = 발전량 ÷ (용량 × 기간 시간) */
    cf: number;
    /** 성능비 PR = 발전량 ÷ (용량 × 일사량) */
    pr: number;
  };
}

/** 스트링 한 줄의 기간 통계 */
export interface StringStat {
  no: number;
  series: number;
  capacityKw: number;
  actualKwh: number;
  ratio: number | null;
}

export interface InverterDetailStats {
  inverter: InverterStat;
  buckets: StatBucket[];
  strings: StringStat[];
}
