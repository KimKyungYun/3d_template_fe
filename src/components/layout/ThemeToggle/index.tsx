import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/components/common/Icon';
import { useTheme, useToggleTheme } from '@/stores/themeStore';
import styles from './ThemeToggle.module.scss';

/** 다크·라이트 전환. 아이콘이 돌면서 바뀐다 */
export function ThemeToggle() {
  const theme = useTheme();
  const toggle = useToggleTheme();
  const label = theme === 'dark' ? '밝은 화면으로' : '어두운 화면으로';

  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label={label} title={label}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          className={styles.toggle__icon}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.22 }}
        >
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
