/*
  일사 곡선 목 — 하루 중 설비 용량 대비 출력 비율.
  실제 계측이 없어 일출·일몰 사이 종 모양 곡선에 날마다 다른 구름 흔들림을 얹는다.
*/
import dayjs from 'dayjs';
import { createRandom, seedOf } from './random';

/** 11월 인천 기준 일출·일몰 (시) — 계절 변화는 두지 않는다 */
export const SUNRISE = 7.1;
export const SUNSET = 17.4;
/** 맑은 날 한낮 최대 출력 비율 */
const PEAK_RATIO = 0.78;

/** 화면이 기준으로 삼는 시각 — 지금이 밤이면 주간 범위로 끌어온다 (야간에 화면이 0 으로만 차지 않게) */
const DAY_FROM = 8;
const DAY_TO = 16.5;

export interface ReferenceClock {
  /** YYYY-MM-DD */
  date: string;
  /** 소수 시 (13.5 = 13:30) */
  hour: number;
  /** HH:mm */
  time: string;
  /** 지금 시각이 아니라 끌어온 시각인지 */
  clamped: boolean;
}

export function referenceClock(now = dayjs()): ReferenceClock {
  const raw = now.hour() + now.minute() / 60;
  const hour = Math.min(DAY_TO, Math.max(DAY_FROM, raw));
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);

  return {
    date: now.format('YYYY-MM-DD'),
    hour,
    time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    clamped: hour !== raw,
  };
}

/** 맑은 날 곡선 (0~PEAK) */
export function clearSkyRatio(hour: number) {
  if (hour <= SUNRISE || hour >= SUNSET) return 0;

  const x = (hour - SUNRISE) / (SUNSET - SUNRISE);

  return PEAK_RATIO * Math.sin(Math.PI * x) ** 1.35;
}

/** 그날 구름 흔들림 — 날짜마다 고정된 0.82~1.0 사이 느린 물결 */
export function cloudFactor(date: string, hour: number) {
  const rand = createRandom(seedOf(`cloud:${date}`));
  const a = rand() * Math.PI * 2;
  const b = rand() * Math.PI * 2;
  const depth = 0.06 + rand() * 0.08;

  return 1 - depth * (0.5 + 0.5 * Math.sin(hour * 1.7 + a)) - 0.04 * (0.5 + 0.5 * Math.sin(hour * 4.3 + b));
}

/** 그 시각 용량 대비 출력 비율 */
export const irradianceRatio = (date: string, hour: number) => clearSkyRatio(hour) * cloudFactor(date, hour);

/** 해 뜬 뒤 hour 까지 쌓인 일사를 설비 용량 기준 발전 시간(h)으로 — 10분 간격 사다리꼴 합 */
export function sunHoursUntil(date: string, hour: number) {
  const step = 1 / 6;
  let sum = 0;

  for (let h = SUNRISE; h < hour; h += step) {
    const next = Math.min(hour, h + step);

    sum += ((irradianceRatio(date, h) + irradianceRatio(date, next)) / 2) * (next - h);
  }

  return sum;
}
