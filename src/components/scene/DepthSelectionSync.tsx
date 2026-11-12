import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useScene, useSceneApi } from './SceneContext';

interface DepthSelectionSyncProps {
  /** 뎁스 주소 — 호기·번호를 비우면 발전소 단 */
  pathOf: (unitId?: string, no?: number) => string;
}

/**
 * 주소의 뎁스(발전소·인버터)와 3D 선택을 맞춘다 (그리는 것 없음).
 * 주소가 인버터면 3D 가 그 인버터를 고르고, 3D 에서 다른 인버터를 누르면 주소가 그 인버터로 옮긴다.
 * 빈 곳을 눌러 선택을 풀면 발전소 단으로 돌아간다. 설비(전기실·RTU)를 고르는 것은 주소를 건드리지 않는다
 */
export function DepthSelectionSync({ pathOf }: DepthSelectionSyncProps) {
  const api = useSceneApi();
  const navigate = useNavigate();
  const { unitId, no, depth } = usePlantScope();
  const selection = useScene((s) => s.selection);

  useEffect(() => {
    const current = api.getState().selection;
    const want = depth === 'inverter' && unitId && no ? { kind: 'inverter' as const, unitId, no } : null;
    const same = want
      ? current?.kind === 'inverter' && current.unitId === want.unitId && current.no === want.no
      : current === null || current.kind !== 'inverter';

    if (!same) api.getState().select(want);
  }, [api, depth, unitId, no]);

  useEffect(() => {
    /*
      렌더 때 받은 selection 대신 스토어의 지금 값을 본다 — 위 효과가 주소를 따라 선택을 막 바꿨으면
      (StrictMode 의 두 번 실행 포함) 그 값이 주소와 같아 다시 주소를 고치지 않는다
    */
    const current = api.getState().selection;

    if (current?.kind === 'inverter') {
      if (depth !== 'inverter' || current.unitId !== unitId || current.no !== no) {
        navigate(pathOf(current.unitId, current.no));
      }
    } else if (current === null && depth === 'inverter') {
      navigate(pathOf());
    }
    // 주소 쪽 값은 위 효과가 맞추므로 선택이 바뀔 때만 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  return null;
}
