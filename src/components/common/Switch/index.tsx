import { cn } from '@/utils/cn';
import styles from './Switch.module.scss';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(styles.switch, { [styles['switch--on']]: checked, [className ?? '']: !!className })}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switch__label}>{label}</span>
      <span className={styles.switch__track} aria-hidden>
        <span className={styles.switch__thumb} />
      </span>
    </button>
  );
}
