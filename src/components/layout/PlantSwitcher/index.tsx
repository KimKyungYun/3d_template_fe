import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { STATUS_META } from '@/configs/status';
import { getPlantSpec, PLANT_SPECS } from '@/plants/catalog';
import { usePlantOverviews } from '@/queries/usePlantQueries';
import { buildPath } from '@/routes/buildPath';
import { PATH } from '@/routes/routes';
import { usePlantId, useSetPlantId } from '@/stores/plantStore';
import { cn } from '@/utils/cn';
import styles from './PlantSwitcher.module.scss';

/** 머리띠의 발전소 고르개. 뎁스 화면에 있으면 같은 메뉴의 새 발전소로 옮긴다 */
export function PlantSwitcher() {
  const plantId = usePlantId();
  const setPlantId = useSetPlantId();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: overviews } = usePlantOverviews();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getPlantSpec(plantId);

  useEffect(() => {
    if (!open) return undefined;

    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const choose = (id: string) => {
    setPlantId(id);
    setOpen(false);

    if (pathname.startsWith(PATH.STATISTICS)) navigate(buildPath.statistics(id));
    else if (pathname.startsWith(PATH.DIAGNOSIS)) navigate(buildPath.diagnosis(id));
  };

  return (
    <div ref={rootRef} className={styles.switcher}>
      <button
        type="button"
        className={cn(styles.switcher__trigger, { [styles['switcher__trigger--open']]: open })}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="pin" size={15} />
        <span className={styles.switcher__name}>{current?.shortName ?? '발전소 선택'}</span>
        <Icon name="chevronDown" size={14} className={styles.switcher__chevron} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            role="listbox"
            aria-label="발전소"
            className={styles.switcher__menu}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            {PLANT_SPECS.map((spec) => {
              const overview = overviews?.find((o) => o.spec.id === spec.id);
              const tone = overview ? STATUS_META[overview.status].tone : 'offline';

              return (
                <li key={spec.id} role="option" aria-selected={spec.id === plantId}>
                  <button
                    type="button"
                    className={cn(styles.switcher__option, {
                      [styles['switcher__option--active']]: spec.id === plantId,
                    })}
                    onClick={() => choose(spec.id)}
                  >
                    <span className={cn(styles.switcher__dot, styles[`switcher__dot--${tone}`])} aria-hidden />
                    <span className={styles.switcher__optionText}>
                      <span className={styles.switcher__optionName}>{spec.name}</span>
                      <span className={styles.switcher__optionMeta}>
                        {spec.region} · {spec.units.length}개 호기
                        {overview?.alertCount ? ` · 이상 ${overview.alertCount}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
