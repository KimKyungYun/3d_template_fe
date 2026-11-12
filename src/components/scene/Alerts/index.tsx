import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { STATUS_COLORS, STATUS_META } from '@/configs/status';
import { alertLabelKey, alertSignature } from '@/plants/builders/alerts';
import AnchoredCard from '../AnchoredCard';
import { usePlantModel, useScene, useSceneApi } from '../SceneContext';
import AlertTag from './AlertTag';

interface AlertCardsProps {
  /** false 면 이름표가 클릭을 받지 않는다 (로그인 배경) */
  interactive?: boolean;
}

/** 이상 설비마다 상시 떠 있는 이름표 — 위치는 LabelProjector 가 옮긴다. 고른 인버터는 선택 카드가 대신한다 */
export default function AlertCards({ interactive = true }: AlertCardsProps) {
  const model = usePlantModel();
  const api = useSceneApi();
  const alerts = useScene((s) => s.alerts.shown);
  const fresh = useScene((s) => s.alerts.fresh);
  const cardLimit = useScene((s) => s.alerts.cardLimit);
  const visible = useScene((s) => s.layers.alerts);
  const selection = useScene((s) => s.selection);
  const theme = useResolvedTheme();
  const multiUnit = model.spec.units.length > 1;

  if (!visible) return null;

  const isSelected = (unitId: string, no: number) =>
    selection?.kind === 'inverter' && selection.unitId === unitId && selection.no === no;

  return alerts
    .filter((a) => !isSelected(a.unitId, a.no))
    .map((a, index) => (
      <AnchoredCard
        key={alertLabelKey(a)}
        labelKey={alertLabelKey(a)}
        variant="alert"
        // 연출 중에는 앞에서부터 cardLimit 장만 보인다 — 숨긴 카드도 그려 두어야 떠오르는 애니메이션이 돈다
        hidden={cardLimit !== null && index >= cardLimit}
        accent={STATUS_COLORS[theme][a.status]}
        fresh={cardLimit !== null ? index === cardLimit - 1 : fresh.includes(alertSignature(a))}
        role="alert"
        passive={!interactive}
      >
        <AlertTag
          alert={a}
          statusLabel={STATUS_META[a.status].short}
          unitLabel={multiUnit ? `${a.unitId}호기 ` : ''}
          onPick={() => {
            if (interactive) api.getState().select({ kind: 'inverter', unitId: a.unitId, no: a.no });
          }}
          focusable={interactive}
        />
      </AnchoredCard>
    ));
}
