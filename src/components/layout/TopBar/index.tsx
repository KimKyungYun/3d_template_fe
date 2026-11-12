import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { LiveClock } from '@/components/layout/LiveClock';
import { PlantSwitcher } from '@/components/layout/PlantSwitcher';
import { navItemOf } from '@/configs/navigation';
import { useAuthUser } from '@/stores/authStore';
import styles from './TopBar.module.scss';

/** 얇은 머리띠 — 화면 이름 · 발전소 고르개 · 시계 · 계정 */
export function TopBar() {
  const { pathname } = useLocation();
  const user = useAuthUser();
  const item = navItemOf(pathname);

  return (
    <header className={styles.bar}>
      <div className={styles.bar__title}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item?.key ?? 'none'}
            className={styles.bar__titleInner}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <h1 className={styles.bar__heading}>{item?.label ?? '3D 태양광 관제'}</h1>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={styles.bar__tools}>
        <PlantSwitcher />
        <LiveClock />
        {user ? <span className={styles.bar__user}>{user.name}</span> : null}
      </div>
    </header>
  );
}
