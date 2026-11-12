import { CountUp } from '@/components/common/CountUp';
import { cn } from '@/utils/cn';
import styles from './StatTile.module.scss';
import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: number;
  unit: string;
  fractionDigits?: number;
  /** 수치 아래 한 줄 — 예측 대비, 대수 내역 */
  sub?: ReactNode;
  tone?: 'solar' | 'accent' | 'critical' | 'neutral';
  /** 0~1 — 아래 얇은 막대로 채운다 */
  meter?: number;
  className?: string;
}

/** 지표 한 칸 — 이름, 굴러가는 수치, 보조 줄, 얇은 막대 (그리기 전용) */
export function StatTile({ label, value, unit, fractionDigits = 0, sub, tone = 'neutral', meter, className }: StatTileProps) {
  return (
    <div className={cn(styles.tile, styles[`tile--${tone}`], { [className ?? '']: !!className })}>
      <span className={styles.tile__label}>{label}</span>
      <span className={styles.tile__value}>
        <CountUp value={value} fractionDigits={fractionDigits} />
        <small>{unit}</small>
      </span>
      {sub ? <span className={styles.tile__sub}>{sub}</span> : null}
      {meter !== undefined ? (
        <span className={styles.tile__meter} aria-hidden>
          <span style={{ transform: `scaleX(${Math.min(1, Math.max(0, meter))})` }} />
        </span>
      ) : null}
    </div>
  );
}
