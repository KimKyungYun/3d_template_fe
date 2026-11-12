import { useFrame } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const MIN_NEAR = 0.3;
const MAX_NEAR = 40;

/**
 * 근평면을 회전 중심까지 거리의 1% 로 맞춘다.
 * near 가 1 로 고정이면 멀리서 볼 때 깊이 정밀도가 모자라 맞닿은 면(모듈·퍼린, 바닥 층)이 깜빡인다
 */
export default function DepthRange() {
  useFrame((state) => {
    const controls = state.controls as OrbitControlsImpl | null;
    const camera = state.camera as PerspectiveCamera;
    if (!controls) return;
    const distance = camera.position.distanceTo(controls.target);
    const near = Math.min(MAX_NEAR, Math.max(MIN_NEAR, distance * 0.01));
    if (Math.abs(near - camera.near) / camera.near > 0.05) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
