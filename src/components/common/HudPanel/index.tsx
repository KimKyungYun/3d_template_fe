import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import styles from './HudPanel.module.scss';
import type { ReactNode } from 'react';

interface HudPanelProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  /** 진입 순서 — 패널이 여러 개면 0.06s 씩 늦게 떠오른다 */
  order?: number;
  /** 본문 여백을 뺀다 — 표·목록이 가장자리까지 차는 자리 */
  flush?: boolean;
  /**
   * 3D 카메라·이름표가 이 판을 피할지 (기본 true). 좌우 기둥이 아닌 위·아래 가운데 띠는 끈다 —
   * 피하기 계산이 판을 왼쪽·오른쪽 기둥으로 보고 빈 폭을 잘못 줄인다
   */
  avoid?: boolean;
  className?: string;
}

/**
 * 3D 스테이지 위에 뜨는 HUD 판. 유리 바탕 + 모서리 꺾쇠.
 * `data-hud` 를 달아 카메라·이름표가 이 판을 피해 자리를 잡게 한다.
 */
export function HudPanel({ title, action, children, order = 0, flush = false, avoid = true, className }: HudPanelProps) {
  return (
    <motion.section
      data-hud={avoid || undefined}
      className={cn(styles.panel, { [className ?? '']: !!className })}
      initial={{ opacity: 0, y: 10, clipPath: 'inset(0 0 100% 0)' }}
      animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
      transition={{ duration: 0.55, delay: 0.12 + order * 0.06 }}
    >
      {title || action ? (
        <header className={styles.panel__head}>
          {title ? <h2 className={styles.panel__title}>{title}</h2> : <span />}
          {action ? <div className={styles.panel__action}>{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(styles.panel__body, { [styles['panel__body--flush']]: flush })}>{children}</div>
    </motion.section>
  );
}
