import { useEffect, useState } from 'react';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { STATUS_COLORS, STATUS_META } from '@/configs/status';
import { alertSignature } from '@/plants/builders/alerts';
import { cn } from '@/utils/cn';
import { usePlantModel, useScene, useSceneApi } from '../SceneContext';
import styles from './AlertToast.module.scss';

/** 알림이 떠 있는 시간 (ms) */
const SHOW_FOR = 5000;
/** 알림에 이름을 늘어놓는 최대 개수 */
const MAX_ITEMS = 3;

/** 스캔이 끝나고 새로 붙은 이상을 도면 위쪽에 잠깐 알린다 — 줄을 누르면 그 인버터를 고른다 */
export default function AlertToast() {
  const model = usePlantModel();
  const api = useSceneApi();
  const scans = useScene((s) => s.alerts.scans);
  const shown = useScene((s) => s.alerts.shown);
  const fresh = useScene((s) => s.alerts.fresh);
  const visible = useScene((s) => s.layers.alerts);
  const theme = useResolvedTheme();
  // 이 스캔 번호까지는 닫힌 것으로 본다 — 화면을 오가며 다시 마운트돼도 지난 알림을 또 띄우지 않게 지금 번호로 시작
  const [dismissed, setDismissed] = useState(() => api.getState().alerts.scans);
  const multiUnit = model.spec.units.length > 1;

  // 심한 이상부터 (고장 → 통신단절 → 주의)
  const items = shown
    .filter((a) => fresh.includes(alertSignature(a)))
    .sort((a, b) => STATUS_META[a.status].rank - STATUS_META[b.status].rank);
  const open = visible && items.length > 0 && dismissed < scans;

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => setDismissed(scans), SHOW_FOR);

    return () => window.clearTimeout(timer);
  }, [open, scans]);

  if (!open) return null;

  return (
    <section key={scans} className={styles.toast} role="status" aria-live="polite">
      <p className={styles.toast__title}>
        <i className={styles.toast__pulse} aria-hidden />
        {scans === 1 ? `스캔 완료 · 이상 설비 ${items.length}건` : `새 이상 ${items.length}건 감지`}
      </p>
      <ul className={styles.toast__list}>
        {items.slice(0, MAX_ITEMS).map((a) => (
          <li key={a.key}>
            <button
              type="button"
              className={styles.toast__item}
              onClick={() => api.getState().select({ kind: 'inverter', unitId: a.unitId, no: a.no })}
            >
              <i className={styles.toast__dot} style={{ background: STATUS_COLORS[theme][a.status] }} />
              {multiUnit ? `${a.unitId}호기 ` : ''}#{a.no}
              <span className={styles.toast__label}>{a.label}</span>
            </button>
          </li>
        ))}
        {items.length > MAX_ITEMS && (
          <li className={cn(styles.toast__item, styles['toast__item--more'])}>외 {items.length - MAX_ITEMS}건</li>
        )}
      </ul>
    </section>
  );
}
