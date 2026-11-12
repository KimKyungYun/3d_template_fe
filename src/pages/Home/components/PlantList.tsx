import { motion } from 'motion/react';
import { CountUp } from '@/components/common/CountUp';
import { HudPanel } from '@/components/common/HudPanel';
import { Skeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePlantOverviews } from '@/queries/usePlantQueries';
import { usePlantId, useSetPlantId } from '@/stores/plantStore';
import { cn } from '@/utils/cn';
import styles from './PlantList.module.scss';

/** 왼쪽 HUD — 등록된 발전소. 고르면 가운데 3D 가 그 발전소로 바뀐다 */
export function PlantList() {
  const { data, isPending } = usePlantOverviews();
  const plantId = usePlantId();
  const setPlantId = useSetPlantId();

  return (
    <HudPanel title="발전소" flush>
      <ul className={styles.list}>
        {isPending
          ? [0, 1].map((i) => (
            <li key={i} className={styles.list__skeleton}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </li>
          ))
          : data?.map((overview, index) => (
            <motion.li
              key={overview.spec.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.06 }}
            >
              <button
                type="button"
                className={cn(styles.list__item, { [styles['list__item--active']]: overview.spec.id === plantId })}
                onClick={() => setPlantId(overview.spec.id)}
              >
                <span className={styles.list__head}>
                  <span className={styles.list__name}>{overview.spec.shortName}</span>
                  <StatusBadge status={overview.status} compact live />
                </span>
                <span className={styles.list__metrics}>
                  <span className={styles.list__power}>
                    <CountUp value={overview.outputKw} fractionDigits={1} />
                    <small>kW</small>
                  </span>
                  <span className={styles.list__meta}>
                    {overview.spec.region} · 이상 {overview.alertCount}
                  </span>
                </span>
              </button>
            </motion.li>
          ))}
      </ul>
    </HudPanel>
  );
}
