import { AlertTriage } from './components/AlertTriage';
import { EfficiencyMatrix } from './components/EfficiencyMatrix';
import { PriorityBanner } from './components/PriorityBanner';
import styles from './Plant.module.scss';

/** 고장진단 · 발전소 뎁스 — 왼쪽 이상 설비, 가운데 우선 조치, 오른쪽 14일 효율 */
export default function DiagnosisPlant() {
  return (
    <>
      <aside className={styles.plant__left}>
        <AlertTriage />
      </aside>
      <div className={styles.plant__center}>
        <PriorityBanner />
      </div>
      <aside className={styles.plant__right}>
        <EfficiencyMatrix />
      </aside>
    </>
  );
}
