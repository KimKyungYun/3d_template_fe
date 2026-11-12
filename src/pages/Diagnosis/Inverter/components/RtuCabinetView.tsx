import { useState } from 'react';
import { Skeleton } from '@/components/common/Skeleton';
import { RTU_CABINET_PHOTO } from '../fieldPhotos';
import { useInverterScope } from '../hooks/useInverterScope';
import { PhotoHotspots } from './PhotoHotspots';
import type { Hotspot } from './PhotoHotspots';

/** RTU 함체 사진 — 차단기·전력량계·ID 모듈·단자대 핫스팟. 끊긴 장비의 ID 모듈이 빨갛게 깜빡인다 */
export function RtuCabinetView() {
  const { equipment } = useInverterScope();
  const [picked, setPicked] = useState<string | null>(null);

  if (!equipment) return <Skeleton height={260} />;

  const lostIds = new Set(equipment.rtu.devices.filter((d) => d.status === 'lost').map((d) => `id${d.deviceId}`));
  const hotspots: Hotspot[] = RTU_CABINET_PHOTO.parts.map((p) => ({
    ...p,
    mark: p.id.startsWith('id') ? p.id.slice(2) : undefined,
    tone: lostIds.has(p.id) ? 'critical' : undefined,
    description: lostIds.has(p.id) ? `통신단절 · ${p.description}` : p.description,
  }));

  return (
    <PhotoHotspots
      src={RTU_CABINET_PHOTO.src}
      alt="RTU 함 내부 — 주 차단기, 전력량계, ID 1~3 수집 모듈, 단자대"
      hotspots={hotspots}
      activeId={picked ?? ([...lostIds][0] ?? 'meter')}
      onPick={setPicked}
      note="참고 사진 · 공용 자료로 실제 함 구성과 다를 수 있음"
    />
  );
}
