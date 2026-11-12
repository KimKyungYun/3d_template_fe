import { HudPanel } from '@/components/common/HudPanel';
import { Skeleton } from '@/components/common/Skeleton';
import { GenerationChart } from '../../components/GenerationChart';
import { PeriodKpi } from '../../components/PeriodKpi';
import { useScrubber } from '../../hooks/useScrubber';
import { useStatisticsData } from '../../hooks/useStatisticsData';
import styles from './PlantPeriodPanel.module.scss';

/** 오른쪽 HUD — 발전소 기간 지표와 칸별 발전량. 막대를 누르면 그 칸을 3D 에 칠한다 */
export function PlantPeriodPanel() {
  const { stats } = useStatisticsData();
  const index = useScrubber((s) => s.index);
  const setIndex = useScrubber((s) => s.setIndex);
  const setPlaying = useScrubber((s) => s.setPlaying);

  return (
    <HudPanel title={stats ? `${stats.rangeLabel} 발전` : '기간 발전'} order={1} className={styles.panel}>
      {!stats ? (
        <div className={styles.period__skeleton}>
          <Skeleton height={64} />
          <Skeleton height={180} />
        </div>
      ) : (
        <div className={styles.period}>
          <PeriodKpi
            actualKwh={stats.totals.actualKwh}
            expectedKwh={stats.totals.expectedKwh}
            hours={stats.totals.hours}
            pr={stats.totals.pr}
            cf={stats.totals.cf}
          />
          <GenerationChart
            buckets={stats.buckets}
            activeIndex={index}
            height={200}
            onPick={(i) => {
              setPlaying(false);
              setIndex(index === i ? null : i);
            }}
          />
        </div>
      )}
    </HudPanel>
  );
}
