import { Link } from 'react-router-dom';
import { HudPanel } from '@/components/common/HudPanel';
import { Icon } from '@/components/common/Icon';
import { buildPath } from '@/routes/buildPath';
import { formatNumber } from '@/utils/format';
import { useInverterDetail } from '../hooks/useInverterDetail';
import styles from './InverterHeader.module.scss';

/** 왼쪽 위 — 인버터 이름·사양, 발전소로 돌아가기, 고장진단으로 건너가기 */
export function InverterHeader() {
  const { filter, plantId, spec, unit, inverterSpec, detail } = useInverterDetail();

  if (!plantId || !unit || !inverterSpec) return null;

  const multiUnit = (spec?.units.length ?? 0) > 1;

  return (
    <HudPanel title={`${multiUnit ? `${unit.id}호기 ` : ''}INV #${inverterSpec.no}`}>
      <div className={styles.header}>
        <Link className={styles.header__back} to={`${buildPath.statistics(plantId)}${filter.search}`}>
          <Icon name="chevronLeft" size={14} />
          {spec?.shortName} 전체
        </Link>
        <dl className={styles.header__specs}>
          <div>
            <dt>위치</dt>
            <dd>{unit.shortName}</dd>
          </div>
          <div>
            <dt>모듈</dt>
            <dd>{formatNumber(inverterSpec.modules)}장</dd>
          </div>
          <div>
            <dt>구성</dt>
            <dd>{inverterSpec.config}</dd>
          </div>
          <div>
            <dt>DC 용량</dt>
            <dd>{detail ? `${formatNumber(detail.inverter.capacityKw, 1)} kW` : '-'}</dd>
          </div>
        </dl>
        <Link className={styles.header__jump} to={buildPath.diagnosis(plantId, unit.id, inverterSpec.no)}>
          <Icon name="pulse" size={14} />
          고장진단에서 보기
        </Link>
      </div>
    </HudPanel>
  );
}
