import { cn } from '@/utils/cn';
import styles from './Button.module.scss';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  isFullWidth?: boolean;
  /** 처리 중 — 누를 수 없게 막고 줄무늬가 흐른다 */
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  isFullWidth = false,
  isLoading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button'}
      className={cn(styles.btn, styles[`btn--${variant}`], styles[`btn--${size}`], {
        [styles['btn--block']]: isFullWidth,
        [styles['btn--loading']]: isLoading,
        [className ?? '']: !!className,
      })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {iconLeft ? <span className={styles.btn__icon}>{iconLeft}</span> : null}
      <span className={styles.btn__label}>{children}</span>
      {iconRight ? <span className={styles.btn__icon}>{iconRight}</span> : null}
    </button>
  );
}
