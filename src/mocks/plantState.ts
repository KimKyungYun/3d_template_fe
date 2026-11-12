/*
  발전소 상태의 단일 원천 (목데이터).

  3D 점등·이상 피드·고장진단 표·홈 KPI 가 모두 이 값 하나를 본다 — 시연용 고장을 3D 에만 넣었다가
  표와 어긋났던 일(asiad_3d_blueprint)을 되풀이하지 않으려는 것이다.
  실제 API 가 붙으면 service/ 의 함수 안쪽만 바꾸고 이 파일은 지운다.
*/
import dayjs from 'dayjs';
import { FAULT_CODES } from '@/configs/faultCodes';
import { EFFICIENCY_CRITICAL, EFFICIENCY_WARN, STATUS_META } from '@/configs/status';
import { PLANT_SPECS } from '@/plants/catalog';
import { inverterKey, stringSeriesOf } from '@/plants/types';
import type { FaultCodeId } from '@/configs/faultCodes';
import type { OperationStatus } from '@/configs/status';
import type { DailyCell, EquipmentAlert, InverterDiagnosis, StringDiagnosis } from '@/interface/diagnosis';
import type { PlantSpec } from '@/plants/types';
import { createRandom, round1, seedOf } from './random';
import { irradianceRatio, referenceClock, sunHoursUntil } from './solar';

/** 조회 기간 — 기준일 포함 14일 */
export const DIAGNOSIS_DAYS = 14;
/** 기준 시각 — 지금 시각(밤이면 주간으로 끌어온 시각). 현재 출력과 금일 발전량이 이 시각 값이다 */
export const REFERENCE_CLOCK = referenceClock();
export const REFERENCE_DATE = REFERENCE_CLOCK.date;
export const REFERENCE_TIME = REFERENCE_CLOCK.time;
/** 기준 시각의 일사 조건 — 설비 용량 대비 순간 출력 비율 */
const REFERENCE_IRRADIANCE = irradianceRatio(REFERENCE_DATE, REFERENCE_CLOCK.hour);
/** 해 뜬 뒤 기준 시각까지 쌓인 일사를 설비 용량 기준 발전 시간(h)으로 */
const REFERENCE_SUN_HOURS = sunHoursUntil(REFERENCE_DATE, REFERENCE_CLOCK.hour);

export const DIAGNOSIS_DATES: string[] = Array.from({ length: DIAGNOSIS_DAYS }, (_, i) =>
  dayjs(REFERENCE_DATE).subtract(DIAGNOSIS_DAYS - 1 - i, 'day').format('YYYY-MM-DD'));

interface Scenario {
  plantId: string;
  unitId: string;
  no: number;
  /** null 이면 통신단절 */
  code: FaultCodeId | null;
  /** 시작 날(0 = 기간 첫날) */
  from: number;
  /** 영향받는 스트링 번호 — 비우면 전체 */
  strings?: number[];
  /** 효율 감소 비율 0~1 */
  drop: number;
}

const SCENARIOS: Scenario[] = [
  // 인천아시아드 — asiad_3d_blueprint 와 같은 시나리오
  { plantId: 'asiad', unitId: '1', no: 7, code: 7, from: 11, drop: 1 },
  { plantId: 'asiad', unitId: '1', no: 12, code: 3, from: 4, strings: [3, 4, 5, 6, 7], drop: 0.3 },
  { plantId: 'asiad', unitId: '1', no: 16, code: 6, from: 9, strings: [2], drop: 0.55 },
  { plantId: 'asiad', unitId: '1', no: 3, code: 1, from: 6, strings: [9, 10, 11, 12, 13, 14, 15, 16], drop: 0.16 },
  { plantId: 'asiad', unitId: '2', no: 5, code: 2, from: 7, strings: [9, 10], drop: 0.34 },
  { plantId: 'asiad', unitId: '2', no: 9, code: null, from: 12, drop: 0 },
  { plantId: 'asiad', unitId: '1', no: 14, code: 8, from: 10, strings: [5], drop: 1 },
  // 새빛 샘플
  { plantId: 'saebit', unitId: '1', no: 2, code: 3, from: 8, strings: [4, 5, 6], drop: 0.22 },
  { plantId: 'saebit', unitId: '1', no: 5, code: 6, from: 11, strings: [7], drop: 0.6 },
];

const SEVERITY_RANK = { info: 0, caution: 1, critical: 2 } as const;

/** 같은 날 여러 코드가 겹치면 더 심한 쪽 */
const worse = (a: FaultCodeId, b: FaultCodeId): FaultCodeId =>
  SEVERITY_RANK[FAULT_CODES[b].severity] > SEVERITY_RANK[FAULT_CODES[a].severity] ? b : a;

const statusOfCell = (cell: DailyCell): OperationStatus => {
  if (cell.efficiency === null) return 'commLost';
  if (cell.faultCode !== null && FAULT_CODES[cell.faultCode].severity === 'critical') return 'fault';
  if (cell.efficiency < EFFICIENCY_CRITICAL) return 'fault';
  if ((cell.faultCode ?? 0) > 0 || cell.efficiency < EFFICIENCY_WARN) return 'degraded';

  return 'running';
};

const worstStatus = (statuses: OperationStatus[]) =>
  statuses.reduce((w, s) => (STATUS_META[s].rank < STATUS_META[w].rank ? s : w), 'running' as OperationStatus);

function diagnose(plant: PlantSpec, unitId: string, no: number): InverterDiagnosis {
  const unit = plant.units.find((u) => u.id === unitId)!;
  const spec = unit.inverters.find((i) => i.no === no)!;
  const key = inverterKey(plant.id, unitId, no);
  const rand = createRandom(seedOf(key));
  const scenarios = SCENARIOS.filter((s) => s.plantId === plant.id && s.unitId === unitId && s.no === no);
  // 인버터마다 바탕 효율이 조금씩 다르다
  const base = 93 + rand() * 4;

  const strings: StringDiagnosis[] = stringSeriesOf(spec.config).map((series, si) => {
    const stringNo = si + 1;
    const daily: DailyCell[] = DIAGNOSIS_DATES.map((date, day) => {
      let efficiency: number | null = base + (rand() - 0.45) * 6;
      let faultCode: FaultCodeId | null = 0;

      for (const sc of scenarios) {
        if (day < sc.from || (sc.strings && !sc.strings.includes(stringNo))) continue;

        if (sc.code === null) {
          efficiency = null;
          faultCode = null;
          continue;
        }

        // 열화는 날이 갈수록 깊어진다
        const progress = sc.code === 1 ? Math.min(1, (day - sc.from + 1) / 6) : 1;

        if (efficiency !== null) efficiency *= 1 - sc.drop * progress;

        faultCode = faultCode === null ? null : worse(faultCode, sc.code);
      }

      return { date, efficiency: efficiency === null ? null : round1(Math.min(100, efficiency)), faultCode };
    });
    const today = daily[daily.length - 1];

    return {
      no: stringNo,
      series,
      capacityKw: round1((series * plant.moduleWatt) / 1000),
      status: statusOfCell(today),
      efficiency: today.efficiency,
      faultCode: today.faultCode,
      daily,
    };
  });

  // 인버터 값은 스트링 값을 용량 가중 평균해 만든다 — 두 뎁스가 같은 수를 말하도록
  const totalKw = strings.reduce((sum, s) => sum + s.capacityKw, 0);
  const daily: DailyCell[] = DIAGNOSIS_DATES.map((date, day) => {
    const cells = strings.map((s) => ({ kw: s.capacityKw, cell: s.daily[day] }));

    if (cells.some((c) => c.cell.efficiency === null)) return { date, efficiency: null, faultCode: null };

    const efficiency = round1(cells.reduce((sum, c) => sum + c.cell.efficiency! * c.kw, 0) / totalKw);
    const faultCode = cells.reduce<FaultCodeId>((code, c) => worse(code, c.cell.faultCode ?? 0), 0);

    return { date, efficiency, faultCode };
  });
  const today = daily[daily.length - 1];
  const capacityKw = round1((spec.modules * plant.moduleWatt) / 1000);
  const expectedKwh = round1(capacityKw * REFERENCE_SUN_HOURS);
  const ratio = today.efficiency === null ? null : today.efficiency / 100;

  return {
    key,
    plantId: plant.id,
    unitId,
    no,
    modules: spec.modules,
    capacityKw,
    status: worstStatus([statusOfCell(today), ...strings.map((s) => s.status)]),
    efficiency: today.efficiency,
    faultCode: today.faultCode,
    outputKw: ratio === null ? null : round1(capacityKw * REFERENCE_IRRADIANCE * ratio),
    expectedKwh,
    actualKwh: ratio === null ? null : round1(expectedKwh * ratio),
    belowDays: daily.filter((d) => d.efficiency !== null && d.efficiency < EFFICIENCY_WARN).length,
    daily,
    strings,
  };
}

/** 발전소별 인버터 진단 — 처음 부를 때 한 번 만들고 담아 둔다 */
const CACHE = new Map<string, InverterDiagnosis[]>();

export function inverterDiagnosisOf(plantId: string): InverterDiagnosis[] {
  const cached = CACHE.get(plantId);

  if (cached) return cached;

  const plant = PLANT_SPECS.find((p) => p.id === plantId);

  if (!plant) return [];

  const list = plant.units.flatMap((u) => u.inverters.map((i) => diagnose(plant, u.id, i.no)));

  CACHE.set(plantId, list);

  return list;
}

/** 이상이 시작된 날 — 오늘부터 거슬러 올라가며 처음으로 정상이던 다음 날 */
function sinceOf(daily: DailyCell[]) {
  let i = daily.length - 1;

  while (i > 0 && statusOfCell(daily[i - 1]) !== 'running') i -= 1;

  return daily[i].date;
}

/** 진단 결과 → 이상 설비. 인버터 전체가 멈추면 인버터 단위, 일부 스트링만이면 그 스트링들 */
export function alertsOf(plantId: string): EquipmentAlert[] {
  return inverterDiagnosisOf(plantId).flatMap((d): EquipmentAlert[] => {
    if (d.status === 'running') return [];

    const base = { key: d.key, plantId, unitId: d.unitId, no: d.no, since: sinceOf(d.daily) };

    if (d.status === 'commLost') {
      return [{ ...base, strings: null, status: d.status, label: '통신단절', faultCode: null }];
    }

    const bad = d.strings.filter((s) => s.status !== 'running');
    const worst = bad.find((s) => s.status === 'fault') ?? bad[0];
    const code = worst?.faultCode ?? d.faultCode;

    return [{
      ...base,
      strings: bad.length === 0 || bad.length === d.strings.length ? null : bad.map((s) => s.no),
      status: d.status,
      label: code ? FAULT_CODES[code].label : '효율 저하',
      faultCode: code || null,
    }];
  });
}
