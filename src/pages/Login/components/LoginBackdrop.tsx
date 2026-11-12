import { Director } from '@/components/scene/Director';
import { DirectorReadout } from '@/components/scene/Director/DirectorReadout';
import { PlantStage } from '@/components/scene/PlantStage';
import { ASIAD_PLANT_ID, ASIAD_SPEC } from '@/plants/asiad/spec';
import { formatNumber } from '@/utils/format';
import styles from './LoginBackdrop.module.scss';

const MODULE_COUNT = ASIAD_SPEC.units.reduce((sum, u) => sum + u.moduleCount, 0);
const CAPACITY_KW = ASIAD_SPEC.units.reduce((sum, u) => sum + u.capacityKw, 0);

/**
 * 로그인 배경 — 대표 발전소 3D 위에서 연출이 돈다.
 * 하늘에서 내려앉고 → 햇빛이 패널을 쓸고 → 패널을 한 장씩 스캔하고 → 이상 지점에 이름표가 하나씩 뜬다
 */
export function LoginBackdrop() {
  return (
    <div className={styles.backdrop}>
      <PlantStage
        plantId={ASIAD_PLANT_ID}
        backdrop
        overlay={(
          <div className={styles.backdrop__hud} aria-hidden>
            <span className={styles.backdrop__vignette} />
            <span className={styles.backdrop__frame} />
            <div className={styles.backdrop__meta}>
              <DirectorReadout className={styles.backdrop__readout} />
              <p className={styles.backdrop__site}>
                {ASIAD_SPEC.shortName} · {formatNumber(MODULE_COUNT)} MODULES · {formatNumber(CAPACITY_KW, 1)} kW
              </p>
            </div>
          </div>
        )}
      >
        <Director />
      </PlantStage>
    </div>
  );
}
