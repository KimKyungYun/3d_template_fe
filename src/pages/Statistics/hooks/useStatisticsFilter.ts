import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { REFERENCE_DATE } from '@/mocks/plantState';
import type { StatPeriod } from '@/interface/generation';
import type { HeatScale } from '@/plants/builders/colors';

const PERIODS: StatPeriod[] = ['day', 'month', 'year'];

export interface StatisticsFilter {
  period: StatPeriod;
  /** 기준 날짜 YYYY-MM-DD */
  date: string;
  /** 히트맵 눈금 — 출력 강도는 일 단위에서만 */
  heat: HeatScale;
  /** 오늘(이번 달·올해)이면 다음으로 넘길 수 없다 */
  isLatest: boolean;
  setPeriod: (period: StatPeriod) => void;
  step: (dir: -1 | 1) => void;
  toToday: () => void;
  setHeat: (heat: HeatScale) => void;
  /** 뎁스를 옮길 때 조회 조건을 그대로 싣는다 */
  search: string;
}

/**
 * 발전통계 조회 조건 — 주소(?period=&date=&heat=)에 둔다.
 * 발전소·인버터 뎁스와 3D 히트맵이 같은 조건 하나를 보고, 주소를 주고받으면 같은 화면이 열린다
 */
export function useStatisticsFilter(): StatisticsFilter {
  const [params, setParams] = useSearchParams();
  const rawPeriod = params.get('period') as StatPeriod | null;
  const period = rawPeriod && PERIODS.includes(rawPeriod) ? rawPeriod : 'day';
  const rawDate = params.get('date');
  const date = rawDate && dayjs(rawDate).isValid() && rawDate <= REFERENCE_DATE ? rawDate : REFERENCE_DATE;
  const heat: HeatScale = period === 'day' && params.get('heat') === 'intensity' ? 'intensity' : 'ratio';
  const unit = period === 'day' ? 'day' : period === 'month' ? 'month' : 'year';
  const isLatest = dayjs(date).isSame(REFERENCE_DATE, unit);

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        for (const [k, v] of Object.entries(patch)) {
          if (v === null) next.delete(k);
          else next.set(k, v);
        }

        return next;
      }, { replace: true });
    },
    [setParams],
  );

  return {
    period,
    date,
    heat,
    isLatest,
    setPeriod: (p) => update({ period: p, heat: p === 'day' ? params.get('heat') : null }),
    step: (dir) => {
      const next = dayjs(date).add(dir, unit);
      const clamped = next.isAfter(REFERENCE_DATE) ? dayjs(REFERENCE_DATE) : next;

      update({ date: clamped.format('YYYY-MM-DD') });
    },
    toToday: () => update({ date: null }),
    setHeat: (h) => update({ heat: h === 'ratio' ? null : h }),
    search: params.toString() ? `?${params.toString()}` : '',
  };
}
