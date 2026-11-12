/*
  기간 발전량 목 — 일사 곡선(mocks/solar)에 인버터 진단 효율을 곱해 만든다.
  진단 기간(14일) 안의 날은 진단 효율을 그대로 쓰고, 그 밖의 날은 인버터마다 시드 고정 효율을 쓴다.
  그래서 고장진단 화면의 효율과 발전통계의 달성률이 같은 날에 같은 값을 말한다.
*/
import dayjs from 'dayjs';
import type { InverterDiagnosis, StringDiagnosis } from '@/interface/diagnosis';
import type { GenerationStats, InverterDetailStats, InverterStat, StatBucket, StatPeriod } from '@/interface/generation';
import { inverterDiagnosisOf, REFERENCE_CLOCK } from './plantState';
import { createRandom, round1, seedOf } from './random';
import { sunHoursUntil, SUNRISE, SUNSET } from './solar';

/** 달마다 일사 비율 (11월 = 기준). 계절 변화를 거칠게 흉내 낸다 */
const MONTH_FACTOR = [0.62, 0.74, 0.9, 1.02, 1.08, 1.0, 0.86, 0.94, 0.96, 0.88, 0.7, 0.58];
const BASE_MONTH = 10;
/** 일사량 환산 — 출력 비율 1 이 1kW/㎡ 에 못 미치는 손실(온도·배선)을 거꾸로 붙인다 */
const SYSTEM_DERATE = 0.84;

const TODAY = REFERENCE_CLOCK.date;

const dayHoursCache = new Map<string, number>();

/** 그날 설비용량 기준 발전시간 (h). 오늘은 기준 시각까지, 내일 이후는 0 */
function dayHours(date: string) {
  const cached = dayHoursCache.get(date);

  if (cached !== undefined) return cached;

  const until = date === TODAY ? REFERENCE_CLOCK.hour : SUNSET;
  const factor = MONTH_FACTOR[dayjs(date).month()] / MONTH_FACTOR[BASE_MONTH];
  const hours = date > TODAY ? 0 : sunHoursUntil(date, until) * factor;

  dayHoursCache.set(date, hours);

  return hours;
}

/** 그날 그 시간(h ~ h+1) 동안의 발전시간 */
const hourHours = (date: string, hour: number) => {
  const until = date === TODAY ? Math.min(REFERENCE_CLOCK.hour, hour + 1) : hour + 1;

  return until <= hour ? 0 : sunHoursUntil(date, until) - sunHoursUntil(date, hour);
};

/** 인버터의 그날 효율 (0~1) — 진단 기간이면 진단 값, 아니면 시드 고정. 미래·통신단절이면 null */
function efficiencyOf(inv: InverterDiagnosis, date: string): number | null {
  if (date > TODAY) return null;

  const cell = inv.daily.find((d) => d.date === date);

  if (cell) return cell.efficiency === null ? null : cell.efficiency / 100;

  const rand = createRandom(seedOf(`${inv.key}:${date}`));

  return 0.92 + rand() * 0.06;
}

function stringEfficiencyOf(inv: InverterDiagnosis, s: StringDiagnosis, date: string) {
  const cell = s.daily.find((d) => d.date === date);

  if (cell) return cell.efficiency === null ? null : cell.efficiency / 100;

  return efficiencyOf(inv, date);
}

interface Slot {
  label: string;
  key: string;
  /** 칸에 든 날짜들과 날마다 발전시간 */
  days: { date: string; hours: number }[];
}

/** 기간을 칸으로 나눈다 — 일: 6~19시, 월: 그달 날짜, 년: 열두 달 */
function slotsOf(period: StatPeriod, date: string): Slot[] {
  const d = dayjs(date);

  if (period === 'day') {
    return Array.from({ length: Math.ceil(SUNSET) - Math.floor(SUNRISE) + 1 }, (_, i) => {
      const hour = Math.floor(SUNRISE) - 1 + i;

      return { label: `${hour}시`, key: String(hour), days: [{ date, hours: hourHours(date, hour) }] };
    });
  }

  if (period === 'month') {
    return Array.from({ length: d.daysInMonth() }, (_, i) => {
      const day = d.date(i + 1).format('YYYY-MM-DD');

      return { label: dayjs(day).format('MM.DD'), key: day, days: [{ date: day, hours: dayHours(day) }] };
    });
  }

  return Array.from({ length: 12 }, (_, m) => {
    const first = d.month(m).date(1);

    return {
      label: `${m + 1}월`,
      key: first.format('YYYY-MM'),
      days: Array.from({ length: first.daysInMonth() }, (__, i) => {
        const day = first.date(i + 1).format('YYYY-MM-DD');

        return { date: day, hours: dayHours(day) };
      }),
    };
  });
}

/** 칸 하나의 실측 — 칸 안 날짜 중 미래는 빼고, 계측이 하나도 없으면 null */
function slotActual(capacityKw: number, slot: Slot, eff: (date: string) => number | null) {
  let sum = 0;
  let measured = false;

  for (const { date, hours } of slot.days) {
    if (date > TODAY) continue;

    const e = eff(date);

    if (e === null) continue;

    measured = true;
    sum += capacityKw * hours * e;
  }

  return measured ? sum : null;
}

const slotExpected = (capacityKw: number, slot: Slot) =>
  slot.days.reduce((sum, { date, hours }) => sum + (date > TODAY ? 0 : capacityKw * hours), 0);

/** 지난 칸까지만 기대값에 넣는다 — 오늘 이후를 빼야 달성률이 맞는다 */
function inverterStat(inv: InverterDiagnosis, slots: Slot[]): InverterStat {
  const buckets = slots.map((slot) => {
    const v = slotActual(inv.capacityKw, slot, (date) => efficiencyOf(inv, date));

    return v === null ? null : round1(v);
  });
  const actualKwh = buckets.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const expectedKwh = slots.reduce((sum, slot) => sum + slotExpected(inv.capacityKw, slot), 0);
  const measured = buckets.some((v) => v !== null);

  return {
    key: inv.key,
    unitId: inv.unitId,
    no: inv.no,
    capacityKw: inv.capacityKw,
    actualKwh: round1(actualKwh),
    expectedKwh: round1(expectedKwh),
    ratio: measured && expectedKwh > 0 ? actualKwh / expectedKwh : null,
    buckets,
  };
}

const rangeLabelOf = (period: StatPeriod, date: string) =>
  dayjs(date).format(period === 'day' ? 'YYYY.MM.DD' : period === 'month' ? 'YYYY.MM' : 'YYYY');

/** 기간 시간 (h) — 이용률 분모. 오늘이 걸리면 지금까지만 */
function periodHours(period: StatPeriod, date: string) {
  const d = dayjs(date);
  const start = d.startOf(period === 'day' ? 'day' : period === 'month' ? 'month' : 'year');
  const end = d.endOf(period === 'day' ? 'day' : period === 'month' ? 'month' : 'year');
  const now = dayjs(`${TODAY} ${REFERENCE_CLOCK.time}`);
  const until = end.isAfter(now) ? now : end;

  return Math.max(1, until.diff(start, 'minute') / 60);
}

export function generationStatsOf(plantId: string, period: StatPeriod, date: string): GenerationStats {
  const inverters = inverterDiagnosisOf(plantId);
  const slots = slotsOf(period, date);
  const stats = inverters.map((inv) => inverterStat(inv, slots));
  const capacityKw = inverters.reduce((sum, i) => sum + i.capacityKw, 0);

  const buckets: StatBucket[] = slots.map((slot, i) => {
    const values = stats.map((s) => s.buckets[i]);
    const measured = values.some((v) => v !== null);
    const sunHours = slot.days.reduce((sum, d) => sum + (d.date > TODAY ? 0 : d.hours), 0);

    return {
      label: slot.label,
      key: slot.key,
      actualKwh: measured ? round1(values.reduce<number>((sum, v) => sum + (v ?? 0), 0)) : null,
      expectedKwh: round1(slotExpected(capacityKw, slot)),
      irradiance: round1((sunHours / SYSTEM_DERATE) * 100) / 100,
    };
  });

  const actualKwh = stats.reduce((sum, s) => sum + s.actualKwh, 0);
  const expectedKwh = stats.reduce((sum, s) => sum + s.expectedKwh, 0);
  const irradiance = buckets.reduce((sum, b) => sum + b.irradiance, 0);

  return {
    plantId,
    period,
    date,
    rangeLabel: rangeLabelOf(period, date),
    capacityKw: round1(capacityKw),
    buckets,
    inverters: stats,
    totals: {
      actualKwh: round1(actualKwh),
      expectedKwh: round1(expectedKwh),
      achievement: expectedKwh > 0 ? actualKwh / expectedKwh : 0,
      hours: capacityKw > 0 ? actualKwh / capacityKw : 0,
      cf: capacityKw > 0 ? actualKwh / (capacityKw * periodHours(period, date)) : 0,
      pr: capacityKw > 0 && irradiance > 0 ? actualKwh / (capacityKw * irradiance) : 0,
    },
  };
}

export function inverterDetailStatsOf(
  plantId: string,
  unitId: string,
  no: number,
  period: StatPeriod,
  date: string,
): InverterDetailStats | null {
  const inv = inverterDiagnosisOf(plantId).find((i) => i.unitId === unitId && i.no === no);

  if (!inv) return null;

  const slots = slotsOf(period, date);
  const stat = inverterStat(inv, slots);
  const buckets: StatBucket[] = slots.map((slot, i) => {
    const sunHours = slot.days.reduce((sum, d) => sum + (d.date > TODAY ? 0 : d.hours), 0);

    return {
      label: slot.label,
      key: slot.key,
      actualKwh: stat.buckets[i],
      expectedKwh: round1(slotExpected(inv.capacityKw, slot)),
      irradiance: round1((sunHours / SYSTEM_DERATE) * 100) / 100,
    };
  });

  return {
    inverter: stat,
    buckets,
    strings: inv.strings.map((s) => {
      const actual = slots.reduce((sum, slot) => sum + (slotActual(s.capacityKw, slot, (d) => stringEfficiencyOf(inv, s, d)) ?? 0), 0);
      const expected = slots.reduce((sum, slot) => sum + slotExpected(s.capacityKw, slot), 0);

      return {
        no: s.no,
        series: s.series,
        capacityKw: s.capacityKw,
        actualKwh: round1(actual),
        ratio: expected > 0 ? actual / expected : null,
      };
    }),
  };
}
