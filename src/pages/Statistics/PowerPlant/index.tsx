import { InverterRanking } from './components/InverterRanking';
import { PlantPeriodPanel } from './components/PlantPeriodPanel';
import styles from './PowerPlant.module.scss';

/** 발전통계 · 발전소 뎁스 — 왼쪽 인버터별 달성률, 오른쪽 기간 지표·칸별 발전량 */
export default function StatisticsPowerPlant() {
  return (
    <>
      <aside className={styles.plant__left}>
        <InverterRanking />
      </aside>
      <aside className={styles.plant__right}>
        <PlantPeriodPanel />
      </aside>
    </>
  );
}
