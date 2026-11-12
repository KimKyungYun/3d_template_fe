import { motion } from 'motion/react';
import { HudPanel } from '@/components/common/HudPanel';
import { Skeleton } from '@/components/common/Skeleton';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { heatColor } from '@/plants/builders/colors';
import { formatNumber } from '@/utils/format';
import { useInverterDetail } from '../hooks/useInverterDetail';
import styles from './StringBreakdown.module.scss';

/** 스트링별 기간 달성률 — 세로 막대가 차오르고, 가장 낮은 스트링을 짚어 준다 */
export function StringBreakdown() {
  const { detail } = useInverterDetail();
  const theme = useResolvedTheme();

  if (!detail) {
    return (
      <HudPanel title="스트링별 달성률" order={1}>
        <Skeleton height={120} />
      </HudPanel>
    );
  }

  const worst = detail.strings.reduce((w, s) => ((s.ratio ?? 2) < (w.ratio ?? 2) ? s : w), detail.strings[0]);

  return (
    <HudPanel title="스트링별 달성률" order={1}>
      <div className={styles.strings}>
        <div className={styles.strings__bars}>
          {detail.strings.map((s, i) => (
            <div key={s.no} className={styles.strings__col} title={`스트링 ${s.no} · ${formatNumber(s.actualKwh, 1)} kWh`}>
              <span className={styles.strings__track}>
                <motion.span
                  className={styles.strings__fill}
                  style={{ backgroundColor: heatColor('ratio', s.ratio, theme) }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: Math.min(1, (s.ratio ?? 0) / 1.1) }}
                  transition={{ duration: 0.6, delay: i * 0.025 }}
                />
              </span>
              <span className={styles.strings__no}>{s.no}</span>
            </div>
          ))}
        </div>
        {worst ? (
          <p className={styles.strings__note}>
            가장 낮은 스트링 <b>{worst.no}</b> · {worst.ratio === null ? '계측 없음' : `${formatNumber(worst.ratio * 100, 1)}%`}
            <span> ({worst.series}직렬 · {formatNumber(worst.capacityKw, 1)} kW)</span>
          </p>
        ) : null}
      </div>
    </HudPanel>
  );
}
