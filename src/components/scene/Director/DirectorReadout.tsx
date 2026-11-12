import { useLabelRef } from '../SceneContext';
import styles from './DirectorReadout.module.scss';
import { DIRECTOR_READOUT_KEY } from './index';

interface DirectorReadoutProps {
  className?: string;
}

/** 연출 진행 표시 — 글자는 Director 가 프레임마다 직접 바꾼다 (리렌더 없이) */
export function DirectorReadout({ className }: DirectorReadoutProps) {
  const register = useLabelRef(DIRECTOR_READOUT_KEY);

  return (
    <p className={className}>
      <span className={styles.readout__dot} aria-hidden />
      <span ref={register} className={styles.readout__text} data-phase="align" aria-live="off">
        SUN TRACKING · CALIBRATING
      </span>
    </p>
  );
}
