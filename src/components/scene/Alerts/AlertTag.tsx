import type { EquipmentAlert } from '@/interface/diagnosis';
import { stringRangeText } from '@/utils/strings';
import styles from './AlertTag.module.scss';

interface AlertTagProps {
  alert: EquipmentAlert;
  statusLabel: string;
  /** 호기 이름 — 호기가 하나뿐인 발전소에서는 비운다 */
  unitLabel: string;
  onPick: () => void;
  /** false 면 키보드 초점도 받지 않는다 (클릭을 받지 않는 화면) */
  focusable?: boolean;
}

/** 이상 이름표 내용 — 설비, 상태, 이상 이름 (그리기 전용) */
export default function AlertTag({ alert, statusLabel, unitLabel, onPick, focusable = true }: AlertTagProps) {
  return (
    <button type="button" className={styles.tag} onClick={onPick} tabIndex={focusable ? undefined : -1}>
      <span className={styles.tag__status}>{statusLabel}</span>
      <span className={styles.tag__name}>
        {unitLabel}#{alert.no}
        {alert.strings && <small>{stringRangeText(alert.strings)}</small>}
      </span>
      <span className={styles.tag__label}>{alert.label}</span>
    </button>
  );
}
