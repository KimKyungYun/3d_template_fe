import { useState } from 'react';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { describe } from '@/plants/builders/describe';
import { SELECTION_LABEL_KEY } from '@/plants/builders/labels';
import AnchoredCard from '../AnchoredCard';
import { usePlantModel, useScene } from '../SceneContext';
import TooltipCard from '../TooltipCard';
import { inverterStatusOf, useSceneStatus } from '../useSceneStatus';

/** 선택한 대상 위에 상시 떠 있는 요약 카드 — 선택이 풀리면 마지막 내용을 남긴 채 옅어진다 */
export default function SelectionCard() {
  const model = usePlantModel();
  const theme = useResolvedTheme();
  const status = useSceneStatus();
  const selection = useScene((s) => s.selection);
  const [last, setLast] = useState(selection);

  if (selection && selection !== last) setLast(selection);

  const shown = selection ?? last;

  if (!shown) return null;

  const inverter = shown.kind === 'inverter' ? inverterStatusOf(status, shown.unitId, shown.no) : null;

  return (
    <AnchoredCard labelKey={SELECTION_LABEL_KEY} variant="selection" hidden={!selection} role="status">
      <TooltipCard info={describe(model, shown, theme)} expanded status={inverter} />
    </AnchoredCard>
  );
}
