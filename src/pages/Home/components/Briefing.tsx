import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { HudPanel } from '@/components/common/HudPanel';
import { usePlantModel, useScene } from '@/components/scene/SceneContext';
import { SCAN_CYCLE, SCAN_DURATION, SCAN_FIRST_DELAY } from '@/plants/builders/alerts';
import { usePlantOverviews } from '@/queries/usePlantQueries';
import { formatNumber } from '@/utils/format';
import styles from './Briefing.module.scss';

type ScanPhase = { kind: 'scanning'; progress: number } | { kind: 'idle'; nextIn: number };

/**
 * 가운데 위 브리핑 띠 — 한 줄 요약과 3D 스캔 진행.
 * 스캔 막대는 3D 의 스캔 선과 같은 시계(스토어의 scanStartedAt)를 본다
 */
export function Briefing() {
  const model = usePlantModel();
  const { data } = usePlantOverviews();
  const overview = data?.find((o) => o.spec.id === model.id);
  const scanStartedAt = useScene((s) => s.alerts.scanStartedAt);
  const scanDuration = useScene((s) => s.alerts.scanDuration);
  const scans = useScene((s) => s.alerts.scans);
  const [phase, setPhase] = useState<ScanPhase>({ kind: 'idle', nextIn: SCAN_FIRST_DELAY / 1000 });
  const committedAt = useRef(0);

  // 스캔을 마칠 때마다 시각을 적어 둔다 — 다음 스캔까지 남은 초를 세는 기준
  useEffect(() => {
    committedAt.current = performance.now();
  }, [scans]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now();

      if (scanStartedAt !== null) {
        setPhase({ kind: 'scanning', progress: Math.min(1, (now - scanStartedAt) / Math.max(1, scanDuration)) });

        return;
      }

      const wait = scans === 0 ? SCAN_FIRST_DELAY : SCAN_CYCLE - SCAN_DURATION;

      setPhase({ kind: 'idle', nextIn: Math.max(0, Math.ceil((wait - (now - committedAt.current)) / 1000)) });
    }, 100);

    return () => window.clearInterval(id);
  }, [scanStartedAt, scanDuration, scans]);

  const total = overview ? Object.values(overview.statusCount).reduce((a, b) => a + b, 0) : 0;
  const sentence = overview
    ? `${model.spec.shortName} · 인버터 ${total}대 중 ${overview.alertCount}대 이상 · 현재 ${formatNumber(overview.outputKw, 0)} kW, 출력률 ${Math.round(overview.outputRatio * 100)}%`
    : '운전 정보 불러오는 중';

  return (
    <HudPanel avoid={false} className={styles.panel}>
      <div className={styles.briefing}>
        <div className={styles.briefing__text}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={sentence}
              className={styles.briefing__sentence}
              initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              {sentence}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className={styles.briefing__scan} data-phase={phase.kind}>
          <span className={styles.briefing__scanLabel}>
            {phase.kind === 'scanning' ? `SCANNING ${Math.round(phase.progress * 100)}%` : `NEXT SCAN ${phase.nextIn}s`}
          </span>
          <span className={styles.briefing__bar} aria-hidden>
            <span
              className={styles.briefing__fill}
              style={{ transform: `scaleX(${phase.kind === 'scanning' ? phase.progress : 0})` }}
            />
          </span>
        </div>
      </div>
    </HudPanel>
  );
}
