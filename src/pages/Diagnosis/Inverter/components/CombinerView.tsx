import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Skeleton } from '@/components/common/Skeleton';
import { FAULT_CODES } from '@/configs/faultCodes';
import { STATUS_META } from '@/configs/status';
import type { FuseSlot } from '@/interface/equipment';
import { COMBINER_PHOTO } from '../fieldPhotos';
import { useInverterScope } from '../hooks/useInverterScope';
import { PhotoHotspots } from './PhotoHotspots';
import type { Hotspot } from './PhotoHotspots';

const fuseText = (fuse: FuseSlot) => {
  const meta = STATUS_META[fuse.status];
  const eff = fuse.efficiency === null ? '계측 없음' : `효율 ${fuse.efficiency}%`;
  const code = fuse.faultCode ? ` · ${FAULT_CODES[fuse.faultCode].label}` : '';

  if (fuse.status === 'running') return `${meta.label} · ${eff}`;

  return `${meta.label} · ${eff}${code}. 직류 주 차단기를 내린 뒤 ${fuse.stringNo}번 (+)·(−) 퓨즈와 단자 체결을 확인합니다.`;
};

/** 접속반 사진 위 스트링 핫스팟 — 이상 스트링의 퓨즈 칸이 상태색으로 깜빡인다. 10회로를 넘으면 함을 나눠 본다 */
export function CombinerView() {
  const { equipment } = useInverterScope();
  const [board, setBoard] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);

  if (!equipment) return <Skeleton height={260} />;

  const fuses = equipment.fuses.filter((f) => f.board === board);
  const firstBad = fuses.find((f) => f.status !== 'running');
  const activeId = picked ?? (firstBad ? `string-${firstBad.stringNo}` : 'monitor');

  const hotspots: Hotspot[] = [
    ...COMBINER_PHOTO.parts.map((p) => ({ ...p })),
    ...fuses.flatMap((f): Hotspot[] => {
      const tone = f.status === 'running' ? undefined : STATUS_META[f.status].tone;

      return [
        {
          id: `string-${f.stringNo}`,
          ...COMBINER_PHOTO.plus[f.slot],
          mark: String(f.stringNo),
          title: `스트링 ${f.stringNo} · (+)입력 퓨즈`,
          description: fuseText(f),
          tone,
        },
        { id: `minus-${f.stringNo}`, ...COMBINER_PHOTO.minus[f.slot], title: '', description: '', tone, passive: true },
      ];
    }),
  ];

  return (
    <div>
      {equipment.boards > 1 ? (
        <SegmentedControl
          size="sm"
          label="접속반"
          value={String(board)}
          onChange={(v) => {
            setBoard(Number(v));
            setPicked(null);
          }}
          options={Array.from({ length: equipment.boards }, (_, i) => ({
            value: String(i + 1),
            label: `접속반 ${i + 1} · 스트링 ${i * 10 + 1}~${Math.min(equipment.fuses.length, (i + 1) * 10)}`,
          }))}
        />
      ) : null}
      <PhotoHotspots
        src={COMBINER_PHOTO.src}
        alt="접속반 내부 — 위 (+)입력·아래 (−)입력 퓨즈, 감시 기판, 주 차단기"
        hotspots={hotspots}
        activeId={activeId}
        onPick={setPicked}
        note="참고 사진 · 공용 자료로 실제 함과 칸 배치가 다를 수 있음"
      />
    </div>
  );
}
