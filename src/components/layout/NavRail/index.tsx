import { motion } from 'motion/react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { NAV_ITEMS, navItemOf } from '@/configs/navigation';
import { buildPath } from '@/routes/buildPath';
import { useSignOut } from '@/stores/authStore';
import { usePlantId } from '@/stores/plantStore';
import { cn } from '@/utils/cn';
import type { NavItem } from '@/configs/navigation';
import styles from './NavRail.module.scss';

/** 메뉴로 들어갈 때 마지막에 본 발전소를 실어 간다 */
const targetOf = (item: NavItem, plantId: string) => {
  if (item.key === 'statistics') return buildPath.statistics(plantId);
  if (item.key === 'diagnosis') return buildPath.diagnosis(plantId);

  return item.path;
};

/** 왼쪽 아이콘 레일. 모바일에서는 아래 탭 막대가 된다 */
export function NavRail() {
  const { pathname } = useLocation();
  const plantId = usePlantId();
  const signOut = useSignOut();
  const current = navItemOf(pathname);

  return (
    <nav className={styles.rail} aria-label="주 메뉴">
      <div className={styles.rail__brand} aria-hidden>
        <span className={styles.rail__mark}>
          <Icon name="cube" size={20} />
        </span>
      </div>
      <ul className={styles.rail__list}>
        {NAV_ITEMS.map((item) => {
          const active = current?.key === item.key;

          return (
            <li key={item.key}>
              <NavLink
                to={targetOf(item, plantId)}
                className={cn(styles.rail__item, { [styles['rail__item--active']]: active })}
                aria-current={active ? 'page' : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-rail-active"
                    className={styles.rail__indicator}
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                  />
                ) : null}
                <Icon name={item.icon} size={20} />
                <span className={styles.rail__label}>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      <div className={styles.rail__foot}>
        <ThemeToggle />
        <button type="button" className={styles.rail__tool} onClick={signOut} aria-label="로그아웃" title="로그아웃">
          <Icon name="logout" size={18} />
        </button>
      </div>
    </nav>
  );
}
