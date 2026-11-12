import { Navigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { usePlantScope } from '@/hooks/usePlantScope';
import { buildPath } from '@/routes/buildPath';
import { getPlantId } from '@/stores/plantStore';
import { FilterBar } from './components/FilterBar';
import { HeatDriver } from './components/HeatDriver';
import { SelectionSync } from './components/SelectionSync';
import { StatisticsStage } from './components/StatisticsStage';
import { TimeScrubber } from './components/TimeScrubber';
import StatisticsInverter from './Inverter';
import StatisticsPowerPlant from './PowerPlant';
import styles from './Statistics.module.scss';

/**
 * 발전통계 — 전면 3D 발전량 히트맵 위에 조회 띠·시간 스크러버를 공통으로 세우고,
 * 주소의 뎁스(발전소·인버터)에 따라 좌우 HUD 를 끼운다
 */
export default function StatisticsPage() {
  const { depth } = usePlantScope();

  if (depth === 'empty') return <Navigate to={buildPath.statistics(getPlantId())} replace />;

  if (depth === 'invalid') {
    return (
      <div className={styles.statistics__invalid}>
        <EmptyState icon="alert" title="설비를 찾을 수 없습니다" />
      </div>
    );
  }

  return (
    <div className={styles.statistics}>
      <StatisticsStage>
        <HeatDriver />
        <SelectionSync />
        <div className={styles.statistics__overlay}>
          {depth === 'plant' ? <StatisticsPowerPlant /> : <StatisticsInverter />}
          <div className={styles.statistics__center}>
            <FilterBar />
            <TimeScrubber />
          </div>
        </div>
      </StatisticsStage>
    </div>
  );
}
