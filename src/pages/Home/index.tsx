import { AlertFeed } from './components/AlertFeed';
import { Briefing } from './components/Briefing';
import { HomeStage } from './components/HomeStage';
import { KpiBoard } from './components/KpiBoard';
import { OutputCurve } from './components/OutputCurve';
import { PlantList } from './components/PlantList';
import styles from './Home.module.scss';

/** 대시보드 — 전면 3D 위에 왼쪽 발전소 목록, 가운데 브리핑·발전 곡선, 오른쪽 지표·이상 피드 */
export default function HomePage() {
  return (
    <div className={styles.home}>
      <HomeStage>
        <div className={styles.home__overlay}>
          <aside className={styles.home__left}>
            <PlantList />
          </aside>
          <div className={styles.home__center}>
            <Briefing />
            <OutputCurve />
          </div>
          <aside className={styles.home__right}>
            <KpiBoard />
            <AlertFeed />
          </aside>
        </div>
      </HomeStage>
    </div>
  );
}
