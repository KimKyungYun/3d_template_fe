import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';
import type { OperationStatus } from '@/configs/status';
import type { TooltipInfo } from '@/plants/builders/describe';
import styles from './TooltipCard.module.scss';

interface TooltipCardProps {
  info: TooltipInfo;
  expanded: boolean;
  /** 인버터 운전 상태 — 선택 카드에서 구역 옆에 배지로 (label 은 이상 이름) */
  status?: { status: OperationStatus; label: string | null } | null;
}

/** 툴팁 내용 — 호버 툴팁은 이름 줄만, 선택 카드는 요약 지표·구성까지 펼친다 (그리기 전용) */
export default function TooltipCard({ info, expanded, status }: TooltipCardProps) {
  return (
    <div key={info.key} className={cn(styles.card, { [styles['card--expanded']]: expanded })}>
      <div className={styles.card__head}>
        {info.accent && <i className={styles.card__dot} style={{ background: info.accent, color: info.accent }} />}
        <strong className={styles.card__name}>{info.name}</strong>
        {info.unitLabel && <span className={styles.card__unit}>{info.unitLabel}</span>}
        {expanded && <span className={styles.card__badge}>선택됨</span>}
      </div>

      {expanded && (
        <div className={styles.card__body}>
          {(info.badge || status) && (
            <div className={styles.card__tags}>
              {info.badge && <span className={styles.card__zone}>{info.badge}</span>}
              {status && <StatusBadge status={status.status} compact />}
              {status?.label && <span className={styles.card__alert}>{status.label}</span>}
            </div>
          )}
          <dl className={styles.card__metrics}>
            {info.metrics.map((m, i) => (
              <div key={m.label} className={styles.card__metric} style={{ animationDelay: `${60 + i * 40}ms` }}>
                <dt className={styles.card__label}>{m.label}</dt>
                <dd className={styles.card__value}>{m.value}</dd>
              </div>
            ))}
          </dl>
          {info.note && <p className={styles.card__note}>{info.note}</p>}
        </div>
      )}
    </div>
  );
}
