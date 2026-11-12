import { Outlet } from 'react-router-dom';
import { NavRail } from '@/components/layout/NavRail';
import { TopBar } from '@/components/layout/TopBar';
import styles from './AppLayout.module.scss';

/**
 * 앱 골격 — 왼쪽 레일 + 얇은 머리띠 + 화면.
 * 화면(페이지)은 남은 칸을 꽉 채우는 3D 스테이지를 깔고 그 위에 HUD 를 띄운다.
 */
export default function AppLayout() {
  return (
    <div className={styles.app}>
      <NavRail />
      <div className={styles.app__main}>
        <TopBar />
        <main className={styles.app__page}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
