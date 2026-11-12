import { CountUp } from '@/components/common/CountUp';
import { HudPanel } from '@/components/common/HudPanel';
import { RingGauge } from '@/components/common/RingGauge';
import { Skeleton } from '@/components/common/Skeleton';
import { StatTile } from '@/components/common/StatTile';
import { STATUS_META } from '@/configs/status';
import { usePlantOverviews } from '@/queries/usePlantQueries';
import { usePlantId } from '@/stores/plantStore';
import { formatNumber } from '@/utils/format';
import styles from './KpiBoard.module.scss';

/** 오른쪽 위 HUD — 고른 발전소의 지금 운전 지표 */
export function KpiBoard() {
  const plantId = usePlantId();
  const { data, isPending } = usePlantOverviews();
  const overview = data?.find((o) => o.spec.id === plantId);

  return (
    <HudPanel title="운전 현황" order={1} action={overview ? <span className={styles.kpi__time}>{overview.gatheredAt.slice(11)} 기준</span> : null}>
      {isPending || !overview ? (
        <div className={styles.kpi__skeleton}>
          <Skeleton height={72} />
          <Skeleton height={64} />
        </div>
      ) : (
        <div className={styles.kpi}>
          <div className={styles.kpi__hero}>
            <RingGauge ratio={overview.outputRatio} label={`출력률 ${Math.round(overview.outputRatio * 100)}%`}>
              <span className={styles.kpi__ratio}>
                <CountUp value={overview.outputRatio * 100} />
                <small>%</small>
              </span>
            </RingGauge>
            <div className={styles.kpi__power}>
              <span className={styles.kpi__label}>현재 출력</span>
              <span className={styles.kpi__powerValue}>
                <CountUp value={overview.outputKw} fractionDigits={1} />
                <small>kW</small>
              </span>
              <span className={styles.kpi__caption}>설비 {formatNumber(overview.capacityKw, 1)} kW</span>
            </div>
          </div>
          <div className={styles.kpi__grid}>
            <StatTile
              label="금일 발전량"
              value={overview.actualKwh}
              unit="kWh"
              tone="solar"
              meter={overview.expectedKwh ? overview.actualKwh / overview.expectedKwh : 0}
              sub={`예측 대비 ${overview.expectedKwh ? Math.round((overview.actualKwh / overview.expectedKwh) * 100) : 0}%`}
            />
            <StatTile
              label="이상 설비"
              value={overview.alertCount}
              unit="대"
              tone={overview.alertCount ? 'critical' : 'neutral'}
              sub={(['fault', 'degraded', 'commLost'] as const)
                .filter((s) => overview.statusCount[s] > 0)
                .map((s) => `${STATUS_META[s].short} ${overview.statusCount[s]}`)
                .join(' · ') || '이상 없음'}
            />
          </div>
        </div>
      )}
    </HudPanel>
  );
}
