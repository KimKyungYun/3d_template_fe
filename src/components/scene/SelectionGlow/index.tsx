import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BoxGeometry, Matrix4, Quaternion, Vector3 } from 'three';
import { NO_RAYCAST, useInstances } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { ACCENT_COLORS } from '@/configs/status';
import { EXPLODE_LIFT } from '@/plants/builders/scene';
import { usePlantModel, useScene } from '../SceneContext';
import type { InstancedMesh, Mesh, MeshBasicMaterial } from 'three';

/** 선택해 둔 동안 계속 깜빡이는 주기(초) */
const PULSE_PERIOD = 1.2;
const OPACITY = { min: 0.18, max: 0.75 } as const;
const BOX = new BoxGeometry(1, 1, 1);

interface SelectionGlowProps {
  unitId: string;
}

/** 선택한 인버터의 모듈 발광과 인버터 상자 바닥 펄스 링 — 선택해 둔 동안 계속 깜빡인다 */
export default function SelectionGlow({ unitId }: SelectionGlowProps) {
  const model = usePlantModel();
  const theme = useResolvedTheme();
  const selection = useScene((s) => s.selection);
  const explode = useScene((s) => s.explode);
  const modulesVisible = useScene((s) => s.layers.modules);
  const invalidate = useThree((s) => s.invalidate);
  const accent = ACCENT_COLORS[theme];
  const no = selection?.kind === 'inverter' && selection.unitId === unitId ? selection.no : null;
  const size = model.moduleSize;

  const { matrices, ring } = useMemo(() => {
    if (no === null) return { matrices: [] as Matrix4[], ring: null };

    const layout = model.units[unitId];
    // 모듈을 살짝 크게·두껍게 감싸는 발광 판
    const local = new Matrix4().compose(
      new Vector3(0, 0.02, 0),
      new Quaternion(),
      new Vector3(size.length * 1.05, size.thickness * 4, size.width * 1.08),
    );
    const list = layout.modules.matrices
      .filter((_, i) => layout.modules.inverter[i] === no)
      .map((m) => m.clone().multiply(local));
    const box = layout.equipment.find((e) => e.kind === 'inverter' && e.inverterNo === no);

    return { matrices: list, ring: box ? box.position : null };
  }, [no, model, unitId, size]);

  const glowRef = useRef<InstancedMesh>(null);
  const glowMat = useRef<MeshBasicMaterial>(null);
  const ringRef = useRef<Mesh>(null);
  const ringMat = useRef<MeshBasicMaterial>(null);
  const startedAt = useRef(0);

  useInstances(glowRef, matrices);

  useEffect(() => {
    startedAt.current = performance.now();
    invalidate();
  }, [no, invalidate]);

  useFrame(() => {
    if (no === null) return;

    // 선택 순간을 0 으로 잡아 매번 밝게 시작하고, 선택이 풀릴 때까지 같은 주기로 깜빡인다
    const phase = ((performance.now() - startedAt.current) / 1000 / PULSE_PERIOD) % 1;

    if (glowMat.current) {
      glowMat.current.opacity = OPACITY.min + (OPACITY.max - OPACITY.min) * Math.cos(phase * Math.PI) ** 2;
    }

    if (ringRef.current && ringMat.current) {
      // 링은 상자에서 퍼져 나가며 옅어지기를 되풀이한다
      ringRef.current.scale.setScalar(1 + phase * 2.2);
      ringMat.current.opacity = 0.9 * (1 - phase);
    }

    // frameloop="demand" 라 선택해 둔 동안은 매 프레임 다음 프레임을 요청한다
    invalidate();
  });

  if (no === null) return null;

  return (
    <>
      <group position-y={explode * EXPLODE_LIFT.modules} visible={modulesVisible}>
        <instancedMesh key={no} ref={glowRef} args={[BOX, undefined, matrices.length]} raycast={NO_RAYCAST}>
          <meshBasicMaterial
            ref={glowMat}
            color={accent}
            transparent
            opacity={OPACITY.max}
            depthWrite={false}
            toneMapped={false}
          />
        </instancedMesh>
      </group>
      {ring && (
        <mesh ref={ringRef} position={[ring[0], 0.32, ring[2]]} rotation-x={-Math.PI / 2} raycast={NO_RAYCAST}>
          <ringGeometry args={[0.9, 1.2, 48]} />
          <meshBasicMaterial
            ref={ringMat}
            color={accent}
            transparent
            opacity={0.75}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  );
}
