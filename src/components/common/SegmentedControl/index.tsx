import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/utils/cn';
import styles from './SegmentedControl.module.scss';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** 두세 갈래 중 하나를 고르는 알약. 고른 칸 아래 판이 미끄러져 따라간다 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const layoutId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(styles.segmented, styles[`segmented--${size}`], { [className ?? '']: !!className })}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cn(styles.segmented__item, { [styles['segmented__item--active']]: active })}
            onClick={() => onChange(option.value)}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className={styles.segmented__thumb}
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            ) : null}
            <span className={styles.segmented__label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
