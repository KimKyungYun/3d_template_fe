import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button } from '@/components/common/Button';
import { HudPanel } from '@/components/common/HudPanel';
import { Icon } from '@/components/common/Icon';
import { usePlantModel, useScene } from '@/components/scene/SceneContext';
import { STATUS_META } from '@/configs/status';
import { useInverterDiagnosis } from '@/queries/usePlantQueries';
import { buildPath } from '@/routes/buildPath';
import { formatNumber } from '@/utils/format';
import styles from './PriorityBanner.module.scss';

/** 가운데 위 — 가장 먼저 볼 고장 한 건. 심한 상태 → 금일 손실이 큰 순으로 고르고, 손실 발전량을 함께 적는다 */
export function PriorityBanner() {
  const model = usePlantModel();
  const navigate = useNavigate();
  const alerts = useScene((s) => s.alerts.shown);
  const { data } = useInverterDiagnosis(model.id);
  const lossOf = (unitId: string, no: number) => {
    const d = data?.find((x) => x.unitId === unitId && x.no === no);

    return d ? Math.max(0, d.expectedKwh - (d.actualKwh ?? 0)) : 0;
  };
  // 심한 상태부터, 같은 상태면 오늘 잃은 발전량이 큰 것부터
  const top = [...alerts].sort((a, b) => STATUS_META[a.status].rank - STATUS_META[b.status].rank
    || lossOf(b.unitId, b.no) - lossOf(a.unitId, a.no))[0];
  const diag = top ? data?.find((d) => d.unitId === top.unitId && d.no === top.no) : undefined;
  const loss = top && diag ? lossOf(top.unitId, top.no) : null;
  const days = top ? dayjs().startOf('day').diff(dayjs(top.since), 'day') : 0;
  const multiUnit = model.unitIds.length > 1;

  return (
    <HudPanel avoid={false} className={styles.panel}>
      <div className={styles.banner} data-tone={top ? STATUS_META[top.status].tone : 'ok'}>
        <span className={styles.banner__icon}><Icon name={top ? 'alert' : 'scan'} size={18} /></span>
        <div className={styles.banner__text}>
          <span className={styles.banner__label}>가장 먼저 볼 고장</span>
          <p className={styles.banner__title}>
            {top
              ? `${multiUnit ? `${top.unitId}호기 ` : ''}INV #${top.no} ${top.label} · ${days <= 0 ? '오늘 발생' : `${days}일째`}`
              : '첫 스캔 진행 중'}
          </p>
          {top && loss !== null ? (
            <span className={styles.banner__sub}>금일 손실 약 {formatNumber(loss, 0)} kWh · 기대 대비 {diag?.efficiency ?? 0}%</span>
          ) : null}
        </div>
        {top ? (
          <Button size="sm" iconRight={<Icon name="chevronRight" size={14} />} onClick={() => navigate(buildPath.diagnosis(model.id, top.unitId, top.no))}>
            현장 조치 보기
          </Button>
        ) : null}
      </div>
    </HudPanel>
  );
}
