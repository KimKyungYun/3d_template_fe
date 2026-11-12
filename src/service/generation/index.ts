import { generationStatsOf, inverterDetailStatsOf } from '@/mocks/generation';
import { inverterDiagnosisOf, REFERENCE_CLOCK } from '@/mocks/plantState';
import { createRandom, round1, seedOf } from '@/mocks/random';
import { irradianceRatio, SUNRISE, SUNSET } from '@/mocks/solar';
import { delay } from '@/service/delay';
import type {
  GenerationStats,
  InverterDetailStats,
  OutputPoint,
  OutputSeries,
  StatPeriod,
} from '@/interface/generation';

/*
  발전량 조회 — 지금은 목 일사 곡선으로 만든다. 실제 API 를 붙일 때 함수 안쪽만 바꾼다.
*/

const STEP_MINUTES = 10;

const timeOf = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** 금일 발전 곡선 — 예측은 하루 전체, 실측은 기준 시각까지. 실측 비율은 인버터 진단 결과를 따른다 */
export async function getTodayOutput(plantId: string): Promise<OutputSeries> {
  await delay(200);

  const inverters = inverterDiagnosisOf(plantId);
  const capacityKw = inverters.reduce((sum, i) => sum + i.capacityKw, 0);
  // 통신단절 인버터는 실측에서 빠진다 — 현재 출력 합과 같은 비율이 되도록
  const ratio = inverters.reduce((sum, i) => sum + (i.efficiency === null ? 0 : (i.efficiency / 100) * i.capacityKw), 0)
    / Math.max(1, capacityKw);
  const { date, hour: until } = REFERENCE_CLOCK;
  const rand = createRandom(seedOf(`output:${plantId}:${date}`));
  const points: OutputPoint[] = [];
  const from = Math.floor(SUNRISE) - 1;
  const to = Math.ceil(SUNSET) + 1;

  for (let hour = from; hour <= to + 1e-6; hour += STEP_MINUTES / 60) {
    const expectedKw = round1(capacityKw * irradianceRatio(date, hour));
    const noise = 1 + (rand() - 0.5) * 0.06;

    points.push({
      time: timeOf(hour),
      hour,
      expectedKw,
      actualKw: hour <= until + 1e-6 ? round1(expectedKw * ratio * noise) : null,
    });
  }

  return { plantId, date, until: timeOf(until), capacityKw: round1(capacityKw), points };
}

/** 기간 발전 통계 — 발전소 전체와 인버터별 */
export async function getGenerationStats(plantId: string, period: StatPeriod, date: string): Promise<GenerationStats> {
  await delay(260);

  return generationStatsOf(plantId, period, date);
}

/** 인버터 한 대의 기간 통계와 스트링별 발전량 */
export async function getInverterStats(
  plantId: string,
  unitId: string,
  no: number,
  period: StatPeriod,
  date: string,
): Promise<InverterDetailStats | null> {
  await delay(220);

  return inverterDetailStatsOf(plantId, unitId, no, period, date);
}
