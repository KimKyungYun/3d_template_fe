import { useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { HudPanel } from '@/components/common/HudPanel';
import { Icon } from '@/components/common/Icon';
import { usePlantModel, useScene, useSceneApi } from '@/components/scene/SceneContext';
import { fieldRouteOf } from '@/plants/builders/fieldGuide';
import { useInverterScope } from '../hooks/useInverterScope';
import styles from './FieldActions.module.scss';

/** 가운데 위 — 현장 조치 길잡이: 사람 눈높이 현장 시점, 전기실에서 찾아가는 길, 인버터 맞추기 */
export function FieldActions() {
  const model = usePlantModel();
  const api = useSceneApi();
  const { unitId, no } = useInverterScope();
  const route = useScene((s) => s.route);
  const routeOn = route?.unitId === unitId && route.no === no;
  const distance = fieldRouteOf(model, unitId, no)?.length ?? null;

  // 다른 인버터로 옮기거나 화면을 떠나면 길을 지운다
  useEffect(() => () => api.getState().setRoute(null), [api, unitId, no]);

  return (
    <HudPanel avoid={false} className={styles.panel}>
      <div className={styles.actions}>
        <div className={styles.actions__buttons}>
          <Button
            size="sm"
            iconLeft={<Icon name="eye" size={14} />}
            onClick={() => {
              // 랙 앞으로 내려가며 뒤쪽 접속반 함 문(한 대 또는 두 대)을 미리 열어 둔다
              api.getState().setDoor(`${unitId}:${no}:combiner1`, true);
              api.getState().setDoor(`${unitId}:${no}:combiner2`, true);
              api.getState().showFieldView(unitId, no);
            }}
          >
            현장 시점
          </Button>
          <Button
            size="sm"
            variant={routeOn ? 'primary' : 'secondary'}
            iconLeft={<Icon name="route" size={14} />}
            onClick={() => api.getState().setRoute(routeOn ? null : { unitId, no })}
            disabled={distance === null}
          >
            찾아가는 길{distance !== null ? ` · 약 ${Math.round(distance)}m` : ''}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            iconLeft={<Icon name="target" size={14} />}
            onClick={() => api.getState().select({ kind: 'inverter', unitId, no })}
          >
            인버터 맞추기
          </Button>
        </div>
        <span className={styles.actions__hint}>WASD 이동 · Q·E 높이 · 확대할수록 느리게</span>
      </div>
    </HudPanel>
  );
}
