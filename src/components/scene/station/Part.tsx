import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, BoxGeometry, EdgesGeometry, Matrix4, Vector3 } from 'three';
import { NO_RAYCAST, PRIORITY_PICK } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { ACCENT_COLORS, STATUS_COLORS } from '@/configs/status';
import type { Vec3 } from '@/plants/model/types';
import { useScene, useSceneApi } from '../SceneContext';
import type { PartInfo } from '../store';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group, LineBasicMaterial, MeshBasicMaterial } from 'three';
import type { ReactNode } from 'react';

const UNIT_BOX = new BoxGeometry(1, 1, 1);
const UNIT_EDGES = new EdgesGeometry(UNIT_BOX);
/** 강조 상자를 부품보다 조금 크게 — 면이 겹쳐 깜빡이지 않게 */
const PAD = 0.012;

/**
 * 부품이 설비의 어느 면에 있는지 — 설비 뿌리(userData.stationRoot)에서 부품 가운데로 가는 수평 방향.
 * 뿌리를 못 찾거나 가운데에 있으면 null (지금 보는 방향 유지)
 */
function facingOf(group: Group | null, localCenter: Vector3): [number, number] | null {
  let root = group?.parent ?? null;

  while (root && !root.userData.stationRoot) root = root.parent;

  if (!group || !root) return null;

  const center = localCenter.clone().applyMatrix4(group.matrixWorld);
  const origin = new Vector3().setFromMatrixPosition(root.matrixWorld);
  const dx = center.x - origin.x;
  const dz = center.z - origin.z;
  const len = Math.hypot(dx, dz);

  return len < 0.05 ? null : [dx / len, dz / len];
}

interface PartProps {
  info: PartInfo;
  children: ReactNode;
  /** false 면 누를 수 없는 장식 */
  interactive?: boolean;
}

interface LocalBox {
  center: Vector3;
  size: Vector3;
  /** 카드 줄기를 세울 점 — 부품 윗면 가운데 (로컬) */
  top: Vector3;
}

/**
 * 설비 부품 한 덩어리 — 안의 메시를 묶어 호버·클릭을 받고,
 * 올리면 시안 테두리, 고르면 굵은 테두리, 이상이면 상태색 막이 맥박친다.
 * 크기는 처음 붙을 때 안의 메시에서 잰다 (부품 모델은 크기를 따로 알릴 필요가 없다)
 */
export function Part({ info, children, interactive = true }: PartProps) {
  const api = useSceneApi();
  const theme = useResolvedTheme();
  const group = useRef<Group>(null);
  const halo = useRef<MeshBasicMaterial>(null);
  const edge = useRef<LineBasicMaterial>(null);
  const invalidate = useThree((s) => s.invalidate);
  const hovered = useScene((s) => s.part.hovered?.key === info.key);
  const selected = useScene((s) => s.part.selected?.key === info.key);
  const pending = useScene((s) => s.part.pendingKey === info.key);
  const [box, setBox] = useState<LocalBox | null>(null);
  const abnormal = info.status !== null && info.status !== 'running';

  // 안의 메시로 로컬 경계 상자를 잰다 — 강조 상자를 그 자리에 씌운다
  useLayoutEffect(() => {
    const g = group.current;

    if (!g) return;

    g.updateWorldMatrix(true, true);

    const inverse = new Matrix4().copy(g.matrixWorld).invert();
    const world = new Box3();

    g.traverse((o) => {
      if (o === g || o.userData.partOverlay) return;
      if ('geometry' in o && o.geometry) world.expandByObject(o, true);
    });

    if (world.isEmpty()) return;

    const local = world.clone().applyMatrix4(inverse);
    const center = local.getCenter(new Vector3());
    const size = local.getSize(new Vector3()).addScalar(PAD * 2);

    setBox({ center, size, top: new Vector3(center.x, local.max.y, center.z) });
  }, []);

  const anchor = (): Vec3 | null => {
    const g = group.current;

    if (!g || !box) return null;

    const p = box.top.clone().applyMatrix4(g.matrixWorld);

    return [p.x, p.y, p.z];
  };

  // 목록에서 이 부품을 골랐으면 — 크기를 잰 뒤 스스로 골라지고 카메라를 가까이 부른다
  useEffect(() => {
    if (!pending || !box) return;

    const a = anchor();
    const state = api.getState();

    state.selectPart(info, a);
    if (a) state.focusOn(a, 1.3, facingOf(group.current, box.center));
    state.requestPart(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, box]);

  useFrame(({ clock }) => {
    if (halo.current) {
      halo.current.opacity = abnormal ? 0.18 + 0.16 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 4)) : 0;
    }

    if (edge.current) edge.current.opacity = selected ? 1 : hovered ? 0.85 : abnormal ? 0.7 : 0;
    if (abnormal) invalidate();
  });

  const handlers = interactive
    ? {
      userData: PRIORITY_PICK,
      onPointerMove: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        api.getState().hoverPart(info, anchor());
      },
      onPointerOut: () => {
        document.body.style.cursor = '';
        api.getState().hoverPart(null);
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();

        const { part, selectPart } = api.getState();

        selectPart(part.selected?.key === info.key ? null : info, anchor());
        invalidate();
      },
    }
    : {};

  const statusColor = info.status ? STATUS_COLORS[theme][info.status] : ACCENT_COLORS[theme];
  const edgeColor = selected || hovered ? ACCENT_COLORS[theme] : statusColor;
  const overlay = useMemo(() => ({ partOverlay: true }), []);

  return (
    <group ref={group} {...handlers}>
      {children}
      {box ? (
        <group position={box.center} scale={box.size} userData={overlay}>
          <lineSegments geometry={UNIT_EDGES} raycast={NO_RAYCAST} renderOrder={12} userData={overlay}>
            <lineBasicMaterial ref={edge} color={edgeColor} transparent opacity={0} depthTest={false} />
          </lineSegments>
          {abnormal ? (
            <mesh geometry={UNIT_BOX} raycast={NO_RAYCAST} renderOrder={11} userData={overlay}>
              <meshBasicMaterial ref={halo} color={statusColor} transparent opacity={0.2} depthWrite={false} />
            </mesh>
          ) : null}
        </group>
      ) : null}
    </group>
  );
}
