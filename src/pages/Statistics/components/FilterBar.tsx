import { Button } from '@/components/common/Button';
import { HudPanel } from '@/components/common/HudPanel';
import { Icon } from '@/components/common/Icon';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { StatPeriod } from '@/interface/generation';
import type { HeatScale } from '@/plants/builders/colors';
import { useScrubber } from '../hooks/useScrubber';
import { useStatisticsData } from '../hooks/useStatisticsData';
import styles from './FilterBar.module.scss';

const PERIOD_OPTIONS: { value: StatPeriod; label: string }[] = [
  { value: 'day', label: '일' },
  { value: 'month', label: '월' },
  { value: 'year', label: '년' },
];

const HEAT_OPTIONS: { value: HeatScale; label: string }[] = [
  { value: 'ratio', label: '달성률' },
  { value: 'intensity', label: '출력 강도' },
];

/** 가운데 위 조회 띠 — 기간 단위, 날짜 넘기기, 히트맵 눈금 */
export function FilterBar() {
  const { filter, stats, isFetching } = useStatisticsData();
  const resetScrub = useScrubber((s) => s.setIndex);

  const changePeriod = (period: StatPeriod) => {
    resetScrub(null);
    filter.setPeriod(period);
  };
  const step = (dir: -1 | 1) => {
    resetScrub(null);
    filter.step(dir);
  };

  return (
    <HudPanel avoid={false} className={styles.panel}>
      <div className={styles.filter}>
        <SegmentedControl options={PERIOD_OPTIONS} value={filter.period} onChange={changePeriod} label="조회 단위" size="sm" />
        <div className={styles.filter__date}>
          <button type="button" className={styles.filter__step} onClick={() => step(-1)} aria-label="이전 기간">
            <Icon name="chevronLeft" size={16} />
          </button>
          <span className={styles.filter__range} data-loading={isFetching || undefined}>
            {stats?.rangeLabel ?? filter.date.replaceAll('-', '.')}
          </span>
          <button
            type="button"
            className={styles.filter__step}
            onClick={() => step(1)}
            disabled={filter.isLatest}
            aria-label="다음 기간"
          >
            <Icon name="chevronRight" size={16} />
          </button>
          {!filter.isLatest ? (
            <Button variant="ghost" size="sm" onClick={filter.toToday}>오늘</Button>
          ) : null}
        </div>
        {filter.period === 'day' ? (
          <SegmentedControl options={HEAT_OPTIONS} value={filter.heat} onChange={filter.setHeat} label="히트맵 눈금" size="sm" />
        ) : (
          <span className={styles.filter__hint}>히트맵 · 기대 대비 달성률</span>
        )}
      </div>
    </HudPanel>
  );
}
