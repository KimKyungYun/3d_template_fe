import { motion } from 'motion/react';
import styles from './RingGauge.module.scss';
import type { ReactNode } from 'react';

interface RingGaugeProps {
  /** 0~1 */
  ratio: number;
  size?: number;
  stroke?: number;
  tone?: 'accent' | 'solar' | 'critical' | 'caution';
  children?: ReactNode;
  label: string;
}

/** 얇은 원형 게이지 — 눈금 36칸 위로 호가 차오른다 */
export function RingGauge({ ratio, size = 72, stroke = 5, tone = 'solar', children, label }: RingGaugeProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));

  return (
    <div className={`${styles.ring} ${styles[`ring--${tone}`]}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className={styles.ring__ticks}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`1.5 ${(c / 36 - 1.5).toFixed(2)}`}
        />
        <motion.circle
          className={styles.ring__arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 1.1, ease: [0.22, 0.68, 0.32, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={styles.ring__center}>{children}</span>
    </div>
  );
}
