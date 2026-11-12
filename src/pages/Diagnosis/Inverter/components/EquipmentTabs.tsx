import { useEffect, useState } from 'react';
import { HudPanel } from '@/components/common/HudPanel';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useScene } from '@/components/scene/SceneContext';
import { useInverterScope } from '../hooks/useInverterScope';
import { PartList } from './PartList';
import { ReferencePhotos } from './ReferencePhotos';
import { RtuView } from './RtuView';
import styles from './EquipmentTabs.module.scss';

type Tab = 'parts' | 'rtu' | 'photos';

/** 오른쪽 HUD — 설비 구조. 3D 부품 목록 · RTU 결선도 · 참고 사진. 3D 에서 RTU 함을 누르면 RTU 결선으로 넘어간다 */
export function EquipmentTabs() {
  const { equipment } = useInverterScope();
  const selection = useScene((s) => s.selection);
  const [tab, setTab] = useState<Tab>('parts');
  const badParts = (equipment?.fuses.filter((f) => f.status !== 'running').length ?? 0)
    + (equipment?.rtu.devices.filter((d) => d.status === 'lost').length ?? 0);
  const lostPorts = equipment?.rtu.devices.filter((d) => d.status === 'lost').length ?? 0;

  useEffect(() => {
    // 3D 에서 RTU 함을 고르면 결선도를 펼친다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selection?.kind === 'equipment' && selection.id.endsWith('-rtu')) setTab('rtu');
  }, [selection]);

  const options: { value: Tab; label: string }[] = [
    { value: 'parts', label: badParts ? `3D 부품 ${badParts}` : '3D 부품' },
    { value: 'rtu', label: lostPorts ? `RTU 결선도 ${lostPorts}` : 'RTU 결선도' },
    { value: 'photos', label: '참고 사진' },
  ];

  return (
    <HudPanel title="설비 구조" order={1} className={styles.panel}>
      <div className={styles.tabs}>
        <SegmentedControl size="sm" label="설비 구조" value={tab} onChange={setTab} options={options} />
        <div className={styles.tabs__body}>
          {tab === 'parts' ? <PartList /> : null}
          {tab === 'rtu' ? <RtuView /> : null}
          {tab === 'photos' ? <ReferencePhotos /> : null}
        </div>
      </div>
    </HudPanel>
  );
}
