import { useState } from 'react';
import { STATUS_META } from '@/configs/status';
import { SITE_PHOTO } from '../fieldPhotos';
import { useInverterScope } from '../hooks/useInverterScope';
import { PhotoHotspots } from './PhotoHotspots';
import type { Hotspot } from './PhotoHotspots';

/** 참고 현장 사진 — 인버터 랙·접속반 함·RTU 함이 현장에서 어떻게 생겼는지. 고른 인버터 자리를 짚는다 */
export function SiteView() {
  const { no, diag } = useInverterScope();
  const [picked, setPicked] = useState<string | null>(null);
  const slot = (no - 1) % SITE_PHOTO.inverters.length;
  const tone = diag && diag.status !== 'running' ? STATUS_META[diag.status].tone : undefined;

  const hotspots: Hotspot[] = [
    ...SITE_PHOTO.inverters.map((p, i): Hotspot => (i === slot
      ? { id: 'inverter', ...p, mark: `#${no}`, title: `인버터 #${no}`, description: '표시창 에러 코드와 출력 램프를 먼저 확인합니다.', tone }
      : { id: `rack-${i}`, ...p, title: '이웃 인버터', description: '같은 랙의 다른 인버터', passive: true })),
    ...SITE_PHOTO.parts.map((p) => ({ ...p })),
  ];

  return (
    <PhotoHotspots
      src={SITE_PHOTO.src}
      alt="참고 현장 — 인버터 랙, 접속반 함, 분전반, RTU 함, 추적식 모듈"
      hotspots={hotspots}
      activeId={picked ?? 'inverter'}
      onPick={setPicked}
      note="참고 현장 사진 · 실제 발전소 위치와 다름"
    />
  );
}
