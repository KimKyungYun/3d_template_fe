import { HudPanel } from '@/components/common/HudPanel';
import { Skeleton } from '@/components/common/Skeleton';
import { GenerationChart } from '../../components/GenerationChart';
import { PeriodKpi } from '../../components/PeriodKpi';
import { useScrubber } from '../../hooks/useScrubber';
import { useInverterDetail } from '../hooks/useInverterDetail';
import styles from './InverterPeriodPanel.module.scss';

/** 오른쪽 HUD — 인버터 기간 지표와 칸별 발전량 */
export function InverterPeriodPanel() {
  const { filter, detail } = useInverterDetail();
  const index = useScrubber((s) => s.index);
  const setIndex = useScrubber((s) => s.setIndex);
  const setPlaying = useScrubber((s) => s.setPlaying);

  return (
    <HudPanel title="인버터 기간 발전" order={1} className={styles.panel}>
      {!detail ? (
        <div className={styles.period__skeleton}>
          <Skeleton height={64} />
          <Skeleton height={180} />
        </div>
      ) : (
        <div className={styles.period}>
          <PeriodKpi
            actualKwh={detail.inverter.actualKwh}
            expectedKwh={detail.inverter.expectedKwh}
            hours={detail.inverter.capacityKw ? detail.inverter.actualKwh / detail.inverter.capacityKw : 0}
          />
          <GenerationChart
            key={filter.period}
            buckets={detail.buckets}
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
