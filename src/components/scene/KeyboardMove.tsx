import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// 키 → 이동 축 (x: 좌우, y: 위아래, z: 앞뒤)
const KEY_AXIS: Record<string, [number, number, number]> = {
  KeyW: [0, 0, 1],
  ArrowUp: [0, 0, 1],
  KeyS: [0, 0, -1],
  ArrowDown: [0, 0, -1],
  KeyA: [-1, 0, 0],
  ArrowLeft: [-1, 0, 0],
  KeyD: [1, 0, 0],
  ArrowRight: [1, 0, 0],
  KeyE: [0, 1, 0],
  PageUp: [0, 1, 0],
  KeyQ: [0, -1, 0],
  PageDown: [0, -1, 0],
};

/** 회전 중심이 가까울수록 느리게 — 부품 앞 1m 에서는 초속 0.5m 안팎 */
const NEAR_MIN_SPEED = 0.4;
const DISTANCE_FACTOR = 0.45;
const FAST_FACTOR = 3;

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

const forward = new Vector3();
const right = new Vector3();
const move = new Vector3();
const delta = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * WASD·화살표(수평), Q·E(높이)로 카메라와 회전 중심을 함께 옮긴다. Shift 를 누르면 빠르다.
 * 물체는 통과한다. 속도는 회전 중심까지 거리에 비례해, 부품 앞처럼 가까이 확대하면 느려진다
 */
export default function KeyboardMove() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  const pressed = useRef(new Set<string>());
  const fast = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      fast.current = e.shiftKey;
      if (!(e.code in KEY_AXIS) || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (pressed.current.size === 0) controls?.dispatchEvent({ type: 'start' } as never);
      pressed.current.add(e.code);
      invalidate();
    };
    const up = (e: KeyboardEvent) => {
      fast.current = e.shiftKey;
      pressed.current.delete(e.code);
    };
    const clear = () => pressed.current.clear();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, [controls, invalidate]);

  useFrame((_, dt) => {
    if (!controls || pressed.current.size === 0) return;

    move.set(0, 0, 0);

    for (const code of pressed.current) {
      const [x, y, z] = KEY_AXIS[code];

      move.x += x;
      move.y += y;
      move.z += z;
    }

    if (move.lengthSq() === 0) return;

    camera.getWorldDirection(forward).setY(0);
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1).applyQuaternion(camera.quaternion).setY(0);
    forward.normalize();
    right.crossVectors(forward, UP).normalize();

    const step = Math.min(dt, 0.05);
    // 회전 중심까지 거리에 비례 — 멀리서 볼 때는 빠르게, 확대해 부품 앞에 있으면 천천히
    const distance = camera.position.distanceTo(controls.target);
    const speed = Math.max(NEAR_MIN_SPEED, distance * DISTANCE_FACTOR) * (fast.current ? FAST_FACTOR : 1);

    delta
      .set(0, 0, 0)
      .addScaledVector(right, move.x)
      .addScaledVector(UP, move.y)
      .addScaledVector(forward, move.z)
      .normalize()
      .multiplyScalar(speed * step);

    camera.position.add(delta);
    controls.target.add(delta);

    controls.update();
    invalidate();
  });

  return null;
}
