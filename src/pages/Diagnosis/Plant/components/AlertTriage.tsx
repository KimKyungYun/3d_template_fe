import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { EmptyState } from '@/components/common/EmptyState';
import { HudPanel } from '@/components/common/HudPanel';
import { usePlantModel, useScene, useSceneApi } from '@/components/scene/SceneContext';
import { STATUS_META } from '@/configs/status';
import { buildPath } from '@/routes/buildPath';
import { cn } from '@/utils/cn';
import { stringRangeText } from '@/utils/strings';
import type { AlertStatus } from '@/interface/diagnosis';
import styles from './AlertTriage.module.scss';

type Filter = 'all' | AlertStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'fault', label: '고장' },
  { value: 'degraded', label: '주의' },
  { value: 'commLost', label: '단절' },
];

/**
 * 왼쪽 HUD — 3D 스캔이 잡은 이상 설비. 고장부터, 같은 상태면 오래된 것부터.
 * 올리면 3D 에서 그 묶음이 밝아지고, 누르면 인버터 뎁스(현장 조치)로 들어간다
 */
export function AlertTriage() {
  const model = usePlantModel();
  const api = useSceneApi();
  const navigate = useNavigate();
  const alerts = useScene((s) => s.alerts.shown);
  const [filter, setFilter] = useState<Filter>('all');
  const multiUnit = model.unitIds.length > 1;

  const rows = useMemo(
    () => alerts
      .filter((a) => filter === 'all' || a.status === filter)
      .sort((a, b) => STATUS_META[a.status].rank - STATUS_META[b.status].rank || a.since.localeCompare(b.since)),
    [alerts, filter],
  );
  const countOf = (f: Filter) => (f === 'all' ? alerts.length : alerts.filter((a) => a.status === f).length);

  return (
    <HudPanel title="이상 설비" flush className={styles.panel}>
      <div className={styles.triage__filters} role="tablist" aria-label="상태 거르기">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            className={cn(styles.triage__chip, { [styles['triage__chip--active']]: filter === f.value })}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span>{countOf(f.value)}</span>
          </button>
        ))}
      </div>
      {alerts.length === 0 ? (
        <EmptyState icon="scan" title="첫 스캔 진행 중" />
      ) : (
        <ul className={styles.triage} onPointerLeave={() => api.getState().clearHover()}>
          <AnimatePresence initial={false}>
            {rows.map((a) => {
              const days = dayjs().startOf('day').diff(dayjs(a.since), 'day');

              return (
                <motion.li key={a.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button
                    type="button"
                    className={cn(styles.triage__row, styles[`triage__row--${STATUS_META[a.status].tone}`])}
                    onPointerEnter={() => api.getState().setHover({ kind: 'inverter', unitId: a.unitId, no: a.no })}
                    onClick={() => navigate(buildPath.diagnosis(model.id, a.unitId, a.no))}
                  >
                    <span className={styles.triage__name}>
                      {multiUnit ? `${a.unitId}호기 ` : ''}INV #{a.no}
                    </span>
                    <span className={styles.triage__label}>{a.label}</span>
                    <span className={styles.triage__meta}>
                      {a.strings ? stringRangeText(a.strings) : '인버터 전체'}
                    </span>
                    <span className={styles.triage__days}>{days <= 0 ? '오늘' : `${days}일째`}</span>
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
