import { EquipmentTabs } from './components/EquipmentTabs';
import { FaultGuide } from './components/FaultGuide';
import { FieldActions } from './components/FieldActions';
import { InverterStatusCard } from './components/InverterStatusCard';
import styles from './Inverter.module.scss';

/** 고장진단 · 인버터 뎁스 — 왼쪽 진단·조치 안내, 가운데 현장 길잡이, 오른쪽 설비 구조(접속반·RTU·현장 사진) */
export default function DiagnosisInverter() {
  return (
    <>
      <aside className={styles.inverter__left}>
        <InverterStatusCard />
        <FaultGuide />
      </aside>
      <div className={styles.inverter__center}>
        <FieldActions />
      </div>
      <aside className={styles.inverter__right}>
        <EquipmentTabs />
      </aside>
    </>
  );
}
