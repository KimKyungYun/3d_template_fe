import { StatusBadge } from '@/components/common/StatusBadge';
import AnchoredCard from '../AnchoredCard';
import { useScene } from '../SceneContext';
import styles from './PartCard.module.scss';
import type { PartInfo } from '../store';

export const PART_LABEL_KEY = 'part';
export const PART_HOVER_KEY = 'part-hover';

function PartBody({ info, expanded }: { info: PartInfo; expanded: boolean }) {
  return (
    <div className={styles.part}>
      <div className={styles.part__head}>
        <strong className={styles.part__title}>{info.title}</strong>
        {info.status ? <StatusBadge status={info.status} compact live /> : null}
      </div>
      {expanded ? (
        <div className={styles.part__body}>
          {info.subtitle ? <span className={styles.part__subtitle}>{info.subtitle}</span> : null}
          <ul className={styles.part__lines}>
            {info.lines.map((line) => <li key={line}>{line}</li>)}
          </ul>
          {info.actions?.length ? (
            <ol className={styles.part__actions}>
              {info.actions.map((line) => <li key={line}>{line}</li>)}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** 설비 부품 카드 — 고른 부품은 상태·조치까지 펼친 카드, 올린 부품은 이름 알약 */
export function PartCard() {
  const selected = useScene((s) => s.part.selected);
  const last = useScene((s) => s.part.lastSelected);
  const hovered = useScene((s) => s.part.hovered);
  const shown = selected ?? last;

  return (
    <>
      {shown ? (
        <AnchoredCard labelKey={PART_LABEL_KEY} variant="selection" hidden={!selected} role="status">
          <PartBody info={shown} expanded />
        </AnchoredCard>
      ) : null}
      <AnchoredCard
        labelKey={PART_HOVER_KEY}
        variant="hover"
        hidden={!hovered || hovered.key === selected?.key}
        role="tooltip"
      >
        {hovered ? <PartBody info={hovered} expanded={false} /> : <span />}
      </AnchoredCard>
    </>
  );
}
