import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { describe } from '@/plants/builders/describe';
import { HOVER_LABEL_KEY } from '@/plants/builders/labels';
import AnchoredCard from '../AnchoredCard';
import { usePlantModel, useScene } from '../SceneContext';
import { isSameTarget } from '../store';
import TooltipCard from '../TooltipCard';

/**
 * 마우스를 올린 대상에 줄기를 세워 띄우는 이름 알약 (인버터·설비 이름까지만).
 * 선택한 대상은 SelectionCard 가 요약 카드로 띄우므로 그 위에서는 숨는다
 */
export default function HoverTooltip() {
  const model = usePlantModel();
  const theme = useResolvedTheme();
  const hovering = useScene((s) => s.hover.target !== null && s.hover.anchor !== null);
  const shown = useScene((s) => s.hover.lastShown);
  const selection = useScene((s) => s.selection);

  // 터치 화면에는 호버가 없으므로 그리지 않는다
  if (!shown || !window.matchMedia('(hover: hover)').matches) return null;

  const active = hovering && !isSameTarget(selection, shown.target);

  return (
    <AnchoredCard labelKey={HOVER_LABEL_KEY} variant="hover" hidden={!active} role="tooltip">
      <TooltipCard info={describe(model, shown.target, theme)} expanded={false} />
    </AnchoredCard>
  );
}
