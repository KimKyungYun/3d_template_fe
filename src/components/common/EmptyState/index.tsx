import { Icon } from '@/components/common/Icon';
import type { IconName } from '@/components/common/Icon';
import styles from './EmptyState.module.scss';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon = 'scan', title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.empty__icon}>
        <Icon name={icon} size={22} />
      </span>
      <p className={styles.empty__title}>{title}</p>
      {description ? <p className={styles.empty__description}>{description}</p> : null}
      {action}
    </div>
  );
}
