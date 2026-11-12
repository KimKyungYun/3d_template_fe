import { InverterHeader } from './components/InverterHeader';
import { InverterPeriodPanel } from './components/InverterPeriodPanel';
import { StringBreakdown } from './components/StringBreakdown';
import styles from './Inverter.module.scss';

/** 발전통계 · 인버터 뎁스 — 왼쪽 인버터 정보·스트링별 달성률, 오른쪽 기간 지표·칸별 발전량 */
export default function StatisticsInverter() {
  return (
    <>
      <aside className={styles.inverter__left}>
        <InverterHeader />
        <StringBreakdown />
      </aside>
      <aside className={styles.inverter__right}>
        <InverterPeriodPanel />
      </aside>
    </>
  );
}
