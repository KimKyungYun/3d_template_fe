import { useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { BoxGeometry, Color, InstancedBufferAttribute, Matrix4, Quaternion, Vector3 } from 'three';
import { NO_RAYCAST, PRIORITY_PICK, useInstances } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { moduleAlertLevels, moduleScanOrder } from '@/plants/builders/alerts';
import { heatColor, inverterColor, SCENE_COLORS, zoneColor } from '@/plants/builders/colors';
import { EXPLODE_LIFT } from '@/plants/builders/scene';
import { unitIndexOf } from '@/plants/model/types';
import type { ModuleSize } from '@/plants/model/types';
import { useAlertShader, usePlantModel, useScene, useSceneApi } from '../SceneContext';
import { heatKey, hoveredInverterOf } from '../store';
import type { InstancedMesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';

const BOX = new BoxGeometry(1, 1, 1);
const WHITE = new Color('#ffffff');

/**
 * 클릭 판 — 모듈 바로 아래 깔린 보이지 않는 넓은 판. 장변 1.6배·단변 4배로 넓혀
 * 가대·띠 사이 틈을 메운다. 레이캐스트는 이 판만 하고, 모듈 번호가 같아 인버터를 그대로 찾는다
 */
const pickLocal = (size: ModuleSize) =>
  new Matrix4().compose(
    new Vector3(0, -0.3, 0),
    new Quaternion(),
    new Vector3(size.length * 1.6, 0.1, size.width * 4),
  );

interface ModuleFieldProps {
  unitId: string;
  /** false 면 클릭·호버를 받지 않는다 (로그인 배경 같은 구경용) */
  interactive: boolean;
}

/** 호기의 모듈 묶음 — 인스턴스 메시 한 장과 그 아래 보이지 않는 클릭 판 */
export default function ModuleField({ unitId, interactive }: ModuleFieldProps) {
  const model = usePlantModel();
  const api = useSceneApi();
  const layout = model.units[unitId];
  const theme = useResolvedTheme();
  const shader = useAlertShader();
  const colorMode = useScene((s) => s.colorMode);
  const heat = useScene((s) => s.heat);
  const selection = useScene((s) => s.selection);
  const explode = useScene((s) => s.explode);
  const visible = useScene((s) => s.layers.modules);
  const hoverNo = useScene((s) => hoveredInverterOf(s, unitId));
  const alerts = useScene((s) => s.alerts.shown);
  const ref = useRef<InstancedMesh>(null);
  const pickRef = useRef<InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);

  const { matrices, inverter, zone } = layout.modules;
  const size = model.moduleSize;
  const total = model.spec.units.find((u) => u.id === unitId)?.inverters.length ?? 0;
  const unitIndex = unitIndexOf(model, unitId);

  // 인스턴스마다 이상 단계와 연출 스캔 순서를 싣는 속성 — 씬의 셰이더(AlertShader)가 읽는다
  const geometry = useMemo(() => {
    const g = new BoxGeometry(size.length, size.thickness, size.width);

    g.setAttribute('alertLevel', new InstancedBufferAttribute(new Float32Array(matrices.length), 1));
    g.setAttribute('scanOrder', new InstancedBufferAttribute(moduleScanOrder(model, unitId), 1));

    return g;
  }, [matrices.length, size, model, unitId]);
  const pickMatrices = useMemo(() => {
    const local = pickLocal(size);

    return matrices.map((m) => m.clone().multiply(local));
  }, [matrices, size]);

  useInstances(ref, matrices);
  useInstances(pickRef, pickMatrices);

  useLayoutEffect(() => {
    const mesh = ref.current;

    if (!mesh) return;

    const scene = SCENE_COLORS[theme];
    const palette = new Map<number, Color>();
    const base = new Color(scene.module);
    const dim = new Color(scene.moduleDim);
    const focusNo = selection?.kind === 'inverter' && selection.unitId === unitId ? selection.no : null;
    const c = new Color();

    for (let i = 0; i < inverter.length; i += 1) {
      const no = inverter[i];

      if (colorMode === 'inverter') {
        if (!palette.has(no)) palette.set(no, new Color(inverterColor(unitIndex, no, total, theme)));
        c.copy(palette.get(no)!);
      } else if (colorMode === 'zone') {
        c.set(zoneColor(theme, zone[i]));
      } else if (colorMode === 'heat' && heat) {
        if (!palette.has(no)) palette.set(no, new Color(heatColor(heat.scale, heat.values[heatKey(unitId, no)] ?? null, theme)));
        c.copy(palette.get(no)!);
      } else {
        c.copy(base);
      }

      if (focusNo !== null && no !== focusNo && no !== hoverNo) c.lerp(dim, 0.8);
      // 마우스를 올린 묶음은 밝게 — 누르기 전에 어떤 인버터가 잡히는지 보여 준다
      if (no === hoverNo && no !== focusNo) c.lerp(WHITE, 0.38);
      mesh.setColorAt(i, c);
    }

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    invalidate();
  }, [colorMode, heat, selection, theme, unitId, unitIndex, total, inverter, zone, hoverNo, invalidate]);

  // 스캔이 끝나 이상 목록이 바뀔 때만 다시 싣는다 (스캔 중에는 이전 점등이 그대로 남는다)
  useLayoutEffect(() => {
    const attr = geometry.getAttribute('alertLevel') as InstancedBufferAttribute;

    attr.array.set(moduleAlertLevels(model, unitId, alerts));
    attr.needsUpdate = true;
    invalidate();
  }, [alerts, geometry, model, unitId, invalidate]);

  const noOf = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
    !visible || e.instanceId === undefined ? null : inverter[e.instanceId];

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // 숨긴 레이어도 레이캐스트에는 걸리므로, 이벤트를 뒤쪽 물체로 흘려보낸다
    const no = noOf(e);

    if (no === null) return;

    e.stopPropagation();
    api.getState().select({ kind: 'inverter', unitId, no });
  };

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    const no = noOf(e);

    if (no === null) return;

    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    // 클릭 판은 모듈보다 0.3m 아래라 모듈 윗면 높이로 올려 둔다
    api.getState().setHover({ kind: 'inverter', unitId, no }, [e.point.x, e.point.y + 0.4, e.point.z]);
  };

  const handleOut = () => {
    document.body.style.cursor = '';
    api.getState().clearHover();
  };

  return (
    <group position-y={explode * EXPLODE_LIFT.modules}>
      <instancedMesh
        ref={ref}
        args={[geometry, undefined, matrices.length]}
        visible={visible}
        castShadow
        receiveShadow
        raycast={NO_RAYCAST}
      >
        <meshStandardMaterial
          metalness={0.35}
          roughness={0.32}
          envMapIntensity={0.6}
          onBeforeCompile={shader.onBeforeCompile}
        />
      </instancedMesh>
      {interactive && (
        <instancedMesh
          ref={pickRef}
          args={[BOX, undefined, pickMatrices.length]}
          userData={PRIORITY_PICK}
          onClick={handleClick}
          onPointerMove={handleMove}
          onPointerOut={handleOut}
        >
          <meshBasicMaterial visible={false} />
        </instancedMesh>
      )}
    </group>
  );
}
