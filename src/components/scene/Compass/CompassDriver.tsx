import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { COMPASS_KEY } from '@/plants/builders/labels';
import { useLabelRegistry } from '../SceneContext';

const forward = new Vector3();
const up = new Vector3();

/**
 * 나침반 원판을 카메라 방향에 맞춰 돌린다. 장면은 -Z 가 북쪽, +X 가 동쪽이다.
 * 화면 위쪽이 가리키는 수평 방향 = 시선 방향 + 카메라 위쪽 (바로 내려다볼 때도 방향이 살아 있도록)
 */
export default function CompassDriver() {
  const labels = useLabelRegistry();

  useFrame(({ camera }) => {
    const el = labels.get(COMPASS_KEY);

    if (!el) return;

    camera.getWorldDirection(forward);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    // 0 이면 북쪽을 보고 있고, 동쪽으로 돌수록 커진다
    const heading = Math.atan2(forward.x + up.x, -(forward.z + up.z));

    el.style.setProperty('--heading', `${((-heading * 180) / Math.PI).toFixed(1)}deg`);
  });

  return null;
}
