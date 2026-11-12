import { COMPASS_KEY } from '@/plants/builders/labels';
import { cn } from '@/utils/cn';
import { useLabelRef } from '../SceneContext';
import styles from './Compass.module.scss';

/** 동서남북 — 원판이 카메라 방향만큼 돌고 글자는 똑바로 선다 (회전은 CompassDriver 가 맡는다) */
export default function Compass() {
  const register = useLabelRef(COMPASS_KEY);

  return (
    <div ref={register} className={styles.compass} role="img" aria-label="방위 표시 — 빨간 바늘이 북쪽">
      <div className={styles.compass__dial}>
        <i className={styles.compass__needle} />
        <span className={cn(styles.compass__mark, styles['compass__mark--north'])}>북</span>
        <span className={cn(styles.compass__mark, styles['compass__mark--east'])}>동</span>
        <span className={cn(styles.compass__mark, styles['compass__mark--south'])}>남</span>
        <span className={cn(styles.compass__mark, styles['compass__mark--west'])}>서</span>
      </div>
    </div>
  );
}
