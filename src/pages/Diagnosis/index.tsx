import { Navigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { usePlantScope } from '@/hooks/usePlantScope';
import { buildPath } from '@/routes/buildPath';
import { getPlantId } from '@/stores/plantStore';
import { DiagnosisStage } from './components/DiagnosisStage';
import { SelectionSync } from './components/SelectionSync';
import DiagnosisInverter from './Inverter';
import DiagnosisPlant from './Plant';
import styles from './Diagnosis.module.scss';

/**
 * 고장진단 — 전면 3D(고장 점등·스캔·결선 경로) 위에 뎁스별 HUD 를 끼운다.
 * 발전소 단은 이상 분류와 14일 효율, 인버터 단은 현장 조치(현장 시점·찾아가는 길·설비 구조)
 */
export default function DiagnosisPage() {
  const { depth } = usePlantScope();

  if (depth === 'empty') return <Navigate to={buildPath.diagnosis(getPlantId())} replace />;

  if (depth === 'invalid') {
    return (
      <div className={styles.diagnosis__invalid}>
        <EmptyState icon="alert" title="설비를 찾을 수 없습니다" />
      </div>
    );
  }

  return (
    <div className={styles.diagnosis}>
      <DiagnosisStage>
        <SelectionSync />
        <div className={styles.diagnosis__overlay}>
          {depth === 'plant' ? <DiagnosisPlant /> : <DiagnosisInverter />}
        </div>
      </DiagnosisStage>
    </div>
  );
}
