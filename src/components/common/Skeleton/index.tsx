import { cn } from '@/utils/cn';
import styles from './Skeleton.module.scss';
import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  className?: string;
}

/** 자리 표시 — 스캔 빛이 왼쪽에서 오른쪽으로 지나간다 */
export function Skeleton({ width = '100%', height = 14, className }: SkeletonProps) {
  return <span className={cn(styles.skeleton, { [className ?? '']: !!className })} style={{ width, height }} aria-hidden />;
}
