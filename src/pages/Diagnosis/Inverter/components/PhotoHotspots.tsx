import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/utils/cn';
import type { StatusTone } from '@/configs/status';
import styles from './PhotoHotspots.module.scss';

export interface Hotspot {
  id: string;
  /** 사진 가로·세로 % */
  x: number;
  y: number;
  /** 점 안에 적는 짧은 글자 — 스트링 번호 등 */
  mark?: string;
  title: string;
  description: string;
  /** 상태색 — 비우면 중립. 이상이면 맥박친다 */
  tone?: StatusTone;
  /** 누를 수 없는 작은 표시 (짝 퓨즈 등) */
  passive?: boolean;
}

interface PhotoHotspotsProps {
  src: string;
  alt: string;
  hotspots: Hotspot[];
  activeId: string | null;
  onPick: (id: string) => void;
  /** 사진 아래 작은 글 — 출처·주의 */
  note?: string;
}

/** 사진 위 핫스팟 — 점을 누르면 아래에 그 부위 설명이 뜬다 (그리기 전용) */
export function PhotoHotspots({ src, alt, hotspots, activeId, onPick, note }: PhotoHotspotsProps) {
  const active = hotspots.find((h) => h.id === activeId) ?? null;

  return (
    <figure className={styles.photo}>
      <div className={styles.photo__frame}>
        <img className={styles.photo__image} src={src} alt={alt} draggable={false} />
        {hotspots.map((h) => (h.passive ? (
          <span
            key={h.id}
            className={cn(styles.photo__dot, styles[`photo__dot--${h.tone ?? 'neutral'}`])}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            aria-hidden
          />
        ) : (
          <button
            key={h.id}
            type="button"
            className={cn(styles.photo__spot, styles[`photo__spot--${h.tone ?? 'neutral'}`], {
              [styles['photo__spot--active']]: h.id === activeId,
            })}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            onClick={() => onPick(h.id)}
            aria-label={h.title}
            aria-pressed={h.id === activeId}
          >
            {h.mark ?? ''}
          </button>
        )))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <motion.figcaption
            key={active.id}
            className={cn(styles.photo__caption, styles[`photo__caption--${active.tone ?? 'neutral'}`])}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <strong>{active.title}</strong>
            <span>{active.description}</span>
          </motion.figcaption>
        ) : null}
      </AnimatePresence>
      {note ? <p className={styles.photo__note}>{note}</p> : null}
    </figure>
  );
}
