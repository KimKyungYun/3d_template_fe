import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { CombinerView } from './CombinerView';
import { RtuCabinetView } from './RtuCabinetView';
import { SiteView } from './SiteView';
import styles from './ReferencePhotos.module.scss';

type Photo = 'combiner' | 'cabinet' | 'site';

const OPTIONS: { value: Photo; label: string }[] = [
  { value: 'combiner', label: '접속반' },
  { value: 'cabinet', label: 'RTU 함' },
  { value: 'site', label: '현장' },
];

/** 참고 사진 탭 — 3D 모델의 바탕이 된 사진 세 장. 사진 위 표시는 3D 와 같은 상태를 따른다 */
export function ReferencePhotos() {
  const [photo, setPhoto] = useState<Photo>('combiner');

  return (
    <div className={styles.photos}>
      <SegmentedControl size="sm" label="참고 사진" value={photo} onChange={setPhoto} options={OPTIONS} />
      {photo === 'combiner' ? <CombinerView /> : null}
      {photo === 'cabinet' ? <RtuCabinetView /> : null}
      {photo === 'site' ? <SiteView /> : null}
    </div>
  );
}
