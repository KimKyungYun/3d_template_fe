import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { useLabelRef } from '../SceneContext';
import styles from './AnchoredCard.module.scss';
import type { CSSProperties, ReactNode } from 'react';

interface AnchoredCardProps {
  /** LabelProjector 가 위치를 옮길 때 찾는 키 */
  labelKey: string;
  variant: 'hover' | 'selection' | 'alert';
  hidden: boolean;
  /** 줄기·점 색 — 이상 카드의 상태색 */
  accent?: string;
  /** 방금 붙은 카드 — 한 번 퍼지는 고리로 알린다 */
  fresh?: boolean;
  role: 'tooltip' | 'status' | 'alert';
  /** true 면 클릭을 받지 않는다 (로그인 배경처럼 구경만 하는 화면) */
  passive?: boolean;
  children: ReactNode;
}

/**
 * 3D 지점에서 줄기를 세워 그 위에 띄우는 카드 껍데기 (그리기 전용).
 * 내용 크기를 재서 상자 너비·높이를 애니메이션하고, 숨길 때는 마지막 내용을 남긴 채 옅어진다
 */
export default function AnchoredCard({ labelKey, variant, hidden, accent, fresh, role, passive = false, children }: AnchoredCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const register = useLabelRef(labelKey);

  useEffect(() => {
    const el = contentRef.current;

    if (!el) return;

    const observer = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={register}
      className={cn(styles.anchored, styles[`anchored--${variant}`], {
        [styles['anchored--hidden']]: hidden,
        [styles['anchored--fresh']]: !!fresh,
        [styles['anchored--passive']]: passive,
      })}
      style={accent ? ({ '--card-accent': accent } as CSSProperties) : undefined}
      role={role}
      aria-hidden={hidden}
    >
      <i className={styles.anchored__point} />
      <i className={styles.anchored__stem} />
      <div className={styles.anchored__box} style={size ? { width: size.w, height: size.h } : undefined}>
        <div
          ref={contentRef}
          className={cn(styles.anchored__content, { [styles['anchored__content--unmeasured']]: !size })}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
