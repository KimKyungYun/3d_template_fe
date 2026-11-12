import { cn } from '@/utils/cn';
import type { SceneLabelData } from '@/plants/model/types';
import { useLabelRegistry, usePlantModel, useScene } from '../SceneContext';
import styles from './SceneLabels.module.scss';

/** 캔버스 위에 겹치는 이름표 층 — 위치는 LabelProjector 가 맡는다 */
export default function SceneLabels() {
  const model = usePlantModel();
  const labels = useLabelRegistry();
  const equipmentVisible = useScene((s) => s.layers.equipment);
  const selection = useScene((s) => s.selection);

  const register = (key: string) => (el: HTMLElement | null) => {
    if (el) labels.set(key, el);
    else labels.delete(key);
  };

  const isShown = (l: SceneLabelData) => l.kind !== 'equipment' || equipmentVisible;
  const isActive = (l: SceneLabelData) =>
    l.kind === 'equipment' &&
    selection?.kind === 'equipment' &&
    selection.unitId === l.unitId &&
    selection.id === l.refId;

  return (
    <div className={styles.labels} aria-hidden>
      {model.labels.map((l) => (
        <span
          key={l.key}
          ref={register(l.key)}
          className={cn(styles.labels__item, {
            [styles['labels__item--landmark']]: l.kind === 'landmark',
            [styles['labels__item--active']]: isActive(l),
            [styles['labels__item--hidden']]: !isShown(l),
          })}
        >
          {l.text}
        </span>
      ))}
    </div>
  );
}
