import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { EmptyState } from '@/components/common/EmptyState';
import { HudPanel } from '@/components/common/HudPanel';
import { usePlantModel, useScene, useSceneApi } from '@/components/scene/SceneContext';
import { STATUS_META } from '@/configs/status';
import { alertAnchor, alertSignature, scanPositionAt } from '@/plants/builders/alerts';
import { cn } from '@/utils/cn';
import type { EquipmentAlert } from '@/interface/diagnosis';
import { stringRangeText } from '@/utils/strings';
import styles from './AlertFeed.module.scss';

const sinceText = (since: string) => {
  const days = dayjs().startOf('day').diff(dayjs(since), 'day');

  return days <= 0 ? '오늘부터' : `${days}일째`;
};

/**
 * 오른쪽 HUD — 이상 설비 피드. 3D 와 같은 이상 목록(스캔 결과)을 본다.
 * 누르면 3D 카메라가 그 인버터로 날아가고, 스캔 선이 그 설비 위를 지나는 순간 줄이 함께 번쩍인다
 */
export function AlertFeed() {
  const model = usePlantModel();
  const api = useSceneApi();
  const alerts = useScene((s) => s.alerts.shown);
  const fresh = useScene((s) => s.alerts.fresh);
  const scanStartedAt = useScene((s) => s.alerts.scanStartedAt);
  const scanDuration = useScene((s) => s.alerts.scanDuration);
  const selection = useScene((s) => s.selection);
  const rows = useRef(new Map<string, HTMLElement>());
  const multiUnit = model.unitIds.length > 1;

  const sorted = useMemo(
    () => [...alerts].sort((a, b) => STATUS_META[a.status].rank - STATUS_META[b.status].rank || a.no - b.no),
    [alerts],
  );
  // 설비마다 스캔 선이 지나는 월드 X
  const anchors = useMemo(
    () => new Map(alerts.map((a) => [a.key, alertAnchor(model, a)?.[0] ?? null])),
    [alerts, model],
  );

  // 스캔 선이 이상 설비를 지나는 순간 그 줄에 빛을 한 번 흘린다
  useEffect(() => {
    if (scanStartedAt === null) return undefined;

    const passed = new Set<string>();
    let raf = 0;

    const tick = () => {
      const position = scanPositionAt(model.scanRange, scanStartedAt, performance.now(), scanDuration);

      if (position === null) return;

      for (const [key, x] of anchors) {
        if (x === null || passed.has(key) || position < x) continue;

        passed.add(key);

        const row = rows.current.get(key);

        if (row) {
          row.classList.remove(styles['feed__row--swept']);
          // 클래스를 다시 붙여 애니메이션을 처음부터 돌린다
          void row.offsetWidth;
          row.classList.add(styles['feed__row--swept']);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [scanStartedAt, scanDuration, anchors, model.scanRange]);

  const isSelected = (a: EquipmentAlert) => selection?.kind === 'inverter' && selection.unitId === a.unitId && selection.no === a.no;

  return (
    <HudPanel title={`이상 설비 ${alerts.length}`} order={2} flush className={styles.panel}>
      {alerts.length === 0 ? (
        <EmptyState icon="scan" title="첫 스캔 진행 중" />
      ) : (
        <ul className={styles.feed}>
          <AnimatePresence initial={false}>
            {sorted.map((a) => {
              const tone = STATUS_META[a.status].tone;

              return (
                <motion.li
                  key={a.key}
                  layout
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    ref={(el) => {
                      if (el) rows.current.set(a.key, el);
                      else rows.current.delete(a.key);
                    }}
                    type="button"
                    className={cn(styles.feed__row, styles[`feed__row--${tone}`], {
                      [styles['feed__row--active']]: isSelected(a),
                      [styles['feed__row--fresh']]: fresh.includes(alertSignature(a)),
                    })}
                    onClick={() => api.getState().select({ kind: 'inverter', unitId: a.unitId, no: a.no })}
                  >
                    <span className={styles.feed__status}>{STATUS_META[a.status].short}</span>
                    <span className={styles.feed__body}>
                      <span className={styles.feed__name}>
                        {multiUnit ? `${a.unitId}호기 ` : ''}INV #{a.no}
                        <em>{a.label}</em>
                      </span>
                      <span className={styles.feed__meta}>
                        {a.strings ? stringRangeText(a.strings) : '인버터 전체'} · {sinceText(a.since)}
                      </span>
                    </span>
                    <span className={styles.feed__go} aria-hidden>›</span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </HudPanel>
  );
}
