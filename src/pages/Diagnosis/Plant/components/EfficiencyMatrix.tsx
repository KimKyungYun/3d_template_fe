import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { HudPanel } from '@/components/common/HudPanel';
import { Skeleton } from '@/components/common/Skeleton';
import { usePlantModel, useSceneApi } from '@/components/scene/SceneContext';
import { FAULT_CODES } from '@/configs/faultCodes';
import { STATUS_META } from '@/configs/status';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { heatColor } from '@/plants/builders/colors';
import { useInverterDiagnosis } from '@/queries/usePlantQueries';
import { buildPath } from '@/routes/buildPath';
import styles from './EfficiencyMatrix.module.scss';

/**
 * 오른쪽 HUD — 인버터 × 14일 진단 효율. 칸 색은 3D 히트맵과 같은 눈금,
 * 고장코드가 붙은 날은 칸 안에 점을 찍는다. 이상이 큰 인버터가 위로 온다
 */
export function EfficiencyMatrix() {
  const model = usePlantModel();
  const api = useSceneApi();
  const navigate = useNavigate();
  const theme = useResolvedTheme();
  const { data } = useInverterDiagnosis(model.id);
  const multiUnit = model.unitIds.length > 1;

  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => STATUS_META[a.status].rank - STATUS_META[b.status].rank
      || (a.efficiency ?? -1) - (b.efficiency ?? -1)),
    [data],
  );
  const dates = rows[0]?.daily.map((d) => d.date) ?? [];

  return (
    <HudPanel title="일자별 진단 효율" order={1} flush className={styles.panel}>
      {!data ? (
        <div className={styles.matrix__skeleton}><Skeleton height={240} /></div>
      ) : (
        <div className={styles.matrix} onPointerLeave={() => api.getState().clearHover()}>
          <div className={styles.matrix__head}>
            <span />
            {dates.map((d, i) => (
              <span key={d} className={styles.matrix__date}>{i % 2 === 1 ? '' : dayjs(d).format('D')}</span>
            ))}
          </div>
          <div className={styles.matrix__body}>
            {rows.map((inv) => (
              <button
                key={inv.key}
                type="button"
                className={styles.matrix__row}
                onPointerEnter={() => api.getState().setHover({ kind: 'inverter', unitId: inv.unitId, no: inv.no })}
                onClick={() => navigate(buildPath.diagnosis(model.id, inv.unitId, inv.no))}
              >
                <span className={styles.matrix__name}>{multiUnit ? `${inv.unitId}-` : '#'}{inv.no}</span>
                {inv.daily.map((cell) => (
                  <span
                    key={cell.date}
                    className={styles.matrix__cell}
                    data-empty={cell.efficiency === null || undefined}
                    style={{ backgroundColor: cell.efficiency === null ? undefined : heatColor('ratio', cell.efficiency / 100, theme) }}
                    title={`${dayjs(cell.date).format('MM.DD')} · ${cell.efficiency === null ? '계측 없음' : `${cell.efficiency}%`}${cell.faultCode ? ` · ${FAULT_CODES[cell.faultCode].label}` : ''}`}
                  >
                    {cell.faultCode ? <i className={styles.matrix__dot} aria-hidden /> : null}
                  </span>
                ))}
              </button>
            ))}
          </div>
          <p className={styles.matrix__legend}>
            <span><i className={styles.matrix__dot} aria-hidden /> 고장코드</span>
            <span><i className={styles.matrix__swatch} data-empty aria-hidden /> 계측 없음</span>
            <span>칸 색 · 기대 대비 효율 (85% 아래 주의)</span>
          </p>
        </div>
      )}
    </HudPanel>
  );
}
