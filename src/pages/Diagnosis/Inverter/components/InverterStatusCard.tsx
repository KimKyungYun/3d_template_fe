import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { HudPanel } from '@/components/common/HudPanel';
import { Icon } from '@/components/common/Icon';
import { Skeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FAULT_CODES } from '@/configs/faultCodes';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { heatColor } from '@/plants/builders/colors';
import { buildPath } from '@/routes/buildPath';
import { formatNumber } from '@/utils/format';
import { useInverterScope } from '../hooks/useInverterScope';
import styles from './InverterStatusCard.module.scss';

/** 왼쪽 위 — 인버터 진단 요약과 스트링 칸. 스트링 칸 색은 3D·접속반 사진과 같은 눈금 */
export function InverterStatusCard() {
  const { plantId, unitId, no, unit, multiUnit, diag, alert } = useInverterScope();
  const theme = useResolvedTheme();
  const title = `${multiUnit ? `${unitId}호기 ` : ''}INV #${no}`;

  if (!diag) {
    return (
      <HudPanel title={title}>
        <Skeleton height={140} />
      </HudPanel>
    );
  }

  const code = alert?.faultCode ?? diag.faultCode;
  const days = alert ? dayjs().startOf('day').diff(dayjs(alert.since), 'day') : 0;

  return (
    <HudPanel title={title} action={<StatusBadge status={alert?.status ?? diag.status} live />}>
      <div className={styles.card}>
        <Link className={styles.card__back} to={buildPath.diagnosis(plantId)}>
          <Icon name="chevronLeft" size={14} />
          발전소 전체
        </Link>
        <p className={styles.card__headline}>
          {alert ? `${alert.label} · ${days <= 0 ? '오늘 발생' : `${days}일째`}` : '이상 없음'}
          {code ? <small>코드 {code}</small> : null}
        </p>
        <dl className={styles.card__facts}>
          <div>
            <dt>진단 효율</dt>
            <dd>{diag.efficiency === null ? '계측 없음' : `${diag.efficiency}%`}</dd>
          </div>
          <div>
            <dt>현재 출력</dt>
            <dd>{diag.outputKw === null ? '-' : `${formatNumber(diag.outputKw, 1)} kW`}</dd>
          </div>
          <div>
            <dt>위치</dt>
            <dd>{unit?.shortName ?? '-'}</dd>
          </div>
          <div>
            <dt>주의 이하 일수</dt>
            <dd>{diag.belowDays}일 / 14일</dd>
          </div>
        </dl>
        <div className={styles.card__strings} aria-label="스트링별 상태">
          {diag.strings.map((s) => (
            <span
              key={s.no}
              className={styles.card__string}
              data-empty={s.efficiency === null || undefined}
              data-bad={s.status !== 'running' || undefined}
              style={{ backgroundColor: s.efficiency === null ? undefined : heatColor('ratio', s.efficiency / 100, theme) }}
              title={`스트링 ${s.no} · ${s.efficiency === null ? '계측 없음' : `${s.efficiency}%`}${s.faultCode ? ` · ${FAULT_CODES[s.faultCode].label}` : ''}`}
            >
              {s.no}
            </span>
          ))}
        </div>
        <Link className={styles.card__jump} to={buildPath.statistics(plantId, unitId, no)}>
          <Icon name="chart" size={14} />
          발전통계에서 보기
        </Link>
      </div>
    </HudPanel>
  );
}
