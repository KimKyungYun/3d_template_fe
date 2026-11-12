import { STATUS_META } from '@/configs/status';
import { cn } from '@/utils/cn';
import type { OperationStatus } from '@/configs/status';
import styles from './StatusBadge.module.scss';

interface StatusBadgeProps {
  status: OperationStatus;
  /** 좁은 자리 — 두 글자 이름(단절)을 쓴다 */
  compact?: boolean;
  /** 이상일 때 점이 맥박친다 */
  live?: boolean;
  className?: string;
}

export function StatusBadge({ status, compact = false, live = false, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      className={cn(styles.badge, styles[`badge--${meta.tone}`], {
        [styles['badge--live']]: live && status !== 'running',
        [className ?? '']: !!className,
      })}
    >
      <span className={styles.badge__dot} aria-hidden />
      {compact ? meta.short : meta.label}
    </span>
  );
}
