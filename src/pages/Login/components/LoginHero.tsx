import { motion } from 'motion/react';
import styles from './LoginHero.module.scss';

const LINES = ['3D 모델링 기반 고장진단'];

/** 로그인 왼쪽 문구 — 줄마다 아래에서 밀려 올라온다 */
export function LoginHero() {
  return (
    <div className={styles.hero}>
      <h1 className={styles.hero__title}>
        {LINES.map((line, index) => (
          <span key={line} className={styles.hero__line}>
            <motion.span
              className={styles.hero__lineInner}
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.12 }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p
        className={styles.hero__description}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        설계 도면으로 만든 3D 발전소에서 고장 위치와 현장 조치 방법을 확인합니다.
      </motion.p>
    </div>
  );
}
