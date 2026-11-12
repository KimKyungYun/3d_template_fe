import { useMemo } from 'react';
import type { FuseSlot } from '@/interface/equipment';
import { CombinerCabinet } from './inverter/CombinerCabinet';
import { InverterUnit } from './inverter/InverterUnit';
import { Rack } from './inverter/Rack';
import { useStationData } from './useStationData';

/** 랙 하나에 올릴 수 있는 접속반 함 수 — 폭 0.9m 안쪽이라 위·아래 두 대까지 */
const MAX_BOARDS = 2;

/** 함 수에 따른 함 가운데 높이 — 한 대면 가로대 사이 가운데, 두 대면 위·아래로 나눠 건다 */
const boardHeights = (boards: number): number[] => (boards >= 2 ? [0.5, 1.34] : [1.02]);

interface InverterStationProps {
  unitId: string;
  no: number;
}

/**
 * 설비 랙 — 아연도금 강관 랙에 앞(+z) 인버터, 뒤(−z) 접속반 함을 겁니다.
 * 원점은 랙 바닥 가운데(지면 y=0)이고 스트링이 10개를 넘으면 접속반 함을 위·아래로 두 대 답니다
 */
export function InverterStation({ unitId, no }: InverterStationProps) {
  const { diag, equipment } = useStationData(unitId, no);
  const boards = Math.min(Math.max(equipment?.boards ?? 1, 1), MAX_BOARDS);

  // 함마다 퓨즈 칸을 갈라 둔다 — 렌더마다 새 배열을 만들면 합친 지오메트리를 다시 짓게 된다
  const byBoard = useMemo(() => {
    const groups: FuseSlot[][] = Array.from({ length: boards }, () => []);

    for (const fuse of equipment?.fuses ?? []) {
      groups[fuse.board - 1]?.push(fuse);
    }

    return groups;
  }, [equipment, boards]);

  return (
    <>
      <Rack />
      <InverterUnit unitId={unitId} no={no} diag={diag} />
      {boardHeights(boards).map((y, i) => (
        <CombinerCabinet
          key={`board${i + 1}`}
          unitId={unitId}
          no={no}
          board={i + 1}
          fuses={byBoard[i] ?? []}
          y={y}
          lost={diag?.status === 'commLost'}
        />
      ))}
    </>
  );
}
