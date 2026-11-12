import { StatTile } from '@/components/common/StatTile';
import styles from './PeriodKpi.module.scss';

interface PeriodKpiProps {
  actualKwh: number;
  expectedKwh: number;
  /** 발전시간 (h) */
  hours: number;
  /** 0~1 — 없으면 칸을 그리지 않는다 */
  pr?: number;
  cf?: number;
}

/** 기간 지표 한 묶음 — 발전량·달성률·발전시간·PR·CF (그리기 전용) */
export function PeriodKpi({ actualKwh, expectedKwh, hours, pr, cf }: PeriodKpiProps) {
  const achievement = expectedKwh > 0 ? actualKwh / expectedKwh : 0;
  const mwh = actualKwh >= 10000;

  return (
    <div className={styles.kpi}>
      <StatTile
        className={styles.kpi__wide}
        label="기간 발전량"
        value={mwh ? actualKwh / 1000 : actualKwh}
        unit={mwh ? 'MWh' : 'kWh'}
        fractionDigits={mwh ? 2 : 0}
        tone="solar"
        meter={achievement}
        sub={`기대 ${(mwh ? expectedKwh / 1000 : expectedKwh).toLocaleString('ko-KR', { maximumFractionDigits: mwh ? 2 : 0 })} ${mwh ? 'MWh' : 'kWh'}`}
      />
      <StatTile
        label="달성률"
        value={achievement * 100}
        unit="%"
        fractionDigits={1}
        tone={achievement < 0.85 ? 'critical' : 'accent'}
      />
      <StatTile label="발전시간" value={hours} unit="h" fractionDigits={1} />
      {pr !== undefined ? <StatTile label="PR" value={pr * 100} unit="%" fractionDigits={1} /> : null}
      {cf !== undefined ? <StatTile label="CF" value={cf * 100} unit="%" fractionDigits={1} /> : null}
    </div>
  );
}
