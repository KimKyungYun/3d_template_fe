import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane, Vector2, Vector3 } from 'three';
import { fitDistance, focusOf, goalOf, isFiniteVec } from '@/plants/builders/camera';
import { fieldViewOf } from '@/plants/builders/fieldGuide';
import type { PlantModel, Selection } from '@/plants/model/types';
import { usePlantModel, useScene, useSceneApi, useSceneRoot } from './SceneContext';
import type { Camera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface Goal {
  target: Vector3;
  position: Vector3;
  /** 다가가는 빠르기 — 클수록 빨리 붙는다 (기본 3.2) */
  speed?: number;
}

/** 첫 진입 연출은 천천히 내려온다 */
const INTRO_SPEED = 1.1;

/** 1·3·7: 회전 중심과 거리는 그대로 두고 바라보는 방향만 바꾼다 (Blender 넘패드 배치) */
const VIEW_KEYS: Record<string, Vector3> = {
  // 정면: 남쪽에서 — 완전히 수평이면 바닥만 보이므로 살짝 내려다본다
  Digit1: new Vector3(0, 0.15, 1).normalize(),
  Numpad1: new Vector3(0, 0.15, 1).normalize(),
  // 측면: 동쪽에서
  Digit3: new Vector3(1, 0.15, 0).normalize(),
  Numpad3: new Vector3(1, 0.15, 0).normalize(),
  // 위: 극점에서 살짝 비켜 OrbitControls 가 뒤집히지 않게
  Digit7: new Vector3(0, 1, 0.01).normalize(),
  Numpad7: new Vector3(0, 1, 0.01).normalize(),
};
const RESET_KEYS = new Set(['Digit0', 'Numpad0', 'Home']);
const FOCUS_KEYS = new Set(['KeyF', 'NumpadDecimal', 'Period']);

/** 더블클릭 지점으로 다가갈 때 거리 — 지금 거리의 절반, 너무 가깝지 않게 */
const DIVE = { ratio: 0.5, min: 12 } as const;
/** 더블클릭이 아무 물체에도 닿지 않으면 바닥면에 떨어뜨린다 */
const GROUND = new Plane(new Vector3(0, 1, 0), 0);

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

const pointer = new Vector2();
const offset = new Vector3();

/** 지금 보는 방향(dir 이 없으면 현재 방향)을 유지한 채 target 을 distance 거리에서 보는 자리 */
function around(camera: Camera, controls: OrbitControlsImpl, target: Vector3, distance: number, dir?: Vector3): Goal {
  const d = dir ? dir.clone() : offset.subVectors(camera.position, controls.target).normalize().clone();

  return { target, position: target.clone().addScaledVector(d, distance) };
}

/** 좌우 패널 칸을 뺀 가운데 빈 폭의 비율 — 모바일처럼 칸이 가로를 다 덮으면 무시한다 */
function freeWidthRatio(root: HTMLElement | null) {
  const box = root?.getBoundingClientRect();
  const width = box?.width ?? 0;

  if (!root || width < 1) return 1;

  let left = 0;
  let right = width;

  for (const col of root.querySelectorAll<HTMLElement>('[data-hud]')) {
    const r = col.getBoundingClientRect();

    if (r.width === 0 || r.width > width * 0.6) continue;
    if (r.left + r.width / 2 < box!.left + width / 2) left = Math.max(left, r.right - box!.left);
    else right = Math.min(right, r.left - box!.left);
  }

  return Math.max(0.3, (right - left) / width);
}

/** 선택 대상이 패널 사이 빈 화면에 꽉 차게 보이는 자리 */
function selectionGoal(
  model: PlantModel,
  sel: Selection,
  camera: Camera,
  controls: OrbitControlsImpl,
  aspect: number,
  root: HTMLElement | null,
): Goal {
  const { target, radius } = focusOf(model, sel);

  return around(camera, controls, target, fitDistance(radius, aspect * freeWidthRatio(root)));
}

interface CameraRigProps {
  /** 높은 곳에서 시작해 첫 시점으로 천천히 내려오는 연출 */
  intro?: boolean;
  /** false 면 더블클릭·키보드 시점 조작을 받지 않는다 */
  interactive?: boolean;
}

/**
 * 카메라 이동을 한곳에서 맡는다 — 뷰 전환, 선택 시 자동 포커스, 더블클릭 포커스, F(선택 대상 맞추기), 1·3·7·0 시점.
 * 목표 자리로 부드럽게 날아가고, 사용자가 조작을 시작하면 멈춘다.
 * 캔버스 크기가 0 이면 aspect 가 NaN 이 되므로, 유한수가 아닌 목표는 버린다
 */
export default function CameraRig({ intro = false, interactive = true }: CameraRigProps) {
  const model = usePlantModel();
  const api = useSceneApi();
  const root = useSceneRoot();
  const view = useScene((s) => s.view);
  const nonce = useScene((s) => s.viewNonce);
  const selection = useScene((s) => s.selection);
  const fieldView = useScene((s) => s.fieldView);
  const focusRequest = useScene((s) => s.focusRequest);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const raycaster = useThree((s) => s.raycaster);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  // frameloop="demand" 이므로 이동하는 동안은 직접 다음 프레임을 요청한다
  const invalidate = useThree((s) => s.invalidate);
  const goalRef = useRef<Goal | null>(null);
  const introRef = useRef(intro);
  // 이미 날아간 선택 — 컨트롤이 늦게 붙어도 처음 선택으로 한 번은 날아가게 한다
  const flownRef = useRef<Selection | null>(null);
  const aspectRef = useRef(aspect);

  // 화면 비율은 매 프레임 바뀔 수 있어 렌더 밖에서 갈아 둔다 — 비율이 바뀔 때마다 다시 날아가면 안 된다
  useEffect(() => {
    aspectRef.current = aspect;
  }, [aspect]);

  /** 목표 자리로 날아가게 한다 — 좌표에 NaN 이 섞이면(캔버스 크기 0) 그 목표는 버린다 */
  const flyTo = useCallback(
    (next: Goal) => {
      if (!isFiniteVec(next.position) || !isFiniteVec(next.target)) return;

      goalRef.current = next;
      invalidate();
    },
    [invalidate],
  );

  useEffect(() => {
    // 첫 진입 연출이면 첫 비행만 느리게
    flyTo({ ...goalOf(model, view, aspectRef.current), speed: introRef.current ? INTRO_SPEED : undefined });
    introRef.current = false;
    // 화면 비율이 바뀔 때마다 다시 날아가지 않도록 aspect 는 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, nonce, model]);

  // 인버터·설비를 고르면(3D 클릭·목록 모두) 그 대상으로 날아가 화면에 맞춘다. 선택 해제는 시점을 그대로 둔다
  useEffect(() => {
    if (!selection || !controls || flownRef.current === selection) return;

    flownRef.current = selection;
    flyTo(selectionGoal(model, selection, camera, controls, aspectRef.current, root.current));
    // 화면 비율·카메라가 바뀔 때는 다시 날아가지 않도록 선택과 컨트롤만 의존한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, controls]);

  // 현장 시점 — 인버터 앞 사람 눈높이로 천천히 내려간다. 그 뒤로는 WASD 로 걸어서 둘러본다
  useEffect(() => {
    if (!fieldView || !controls) return;

    const goal = fieldViewOf(model, fieldView.unitId, fieldView.no, camera.position.toArray() as [number, number, number]);

    if (!goal) return;

    flyTo({ position: new Vector3(...goal.position), target: new Vector3(...goal.target), speed: 1.8 });
    // 같은 인버터로 다시 눌러도 nonce 가 바뀌어 다시 내려간다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldView, controls]);

  // 부품 목록에서 고른 점으로 — 지금 보는 방향을 지킨 채 distance 까지 다가간다
  useEffect(() => {
    if (!focusRequest || !controls) return;

    const target = new Vector3(...focusRequest.target);
    // 부품이 랙 뒷면에 있으면 그쪽에서 살짝 내려다보며 다가간다 — 앞면 인버터에 가리지 않게
    const dir = focusRequest.from
      ? new Vector3(focusRequest.from[0], 0.45, focusRequest.from[1]).normalize()
      : camera.position.clone().sub(controls.target).normalize();

    flyTo({ target, position: target.clone().addScaledVector(dir, focusRequest.distance), speed: 2.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest, controls]);

  useEffect(() => {
    if (!controls) return;

    // 직접 돌리거나 확대하면 날아가던 것과 자동 순회를 함께 멈춘다
    const stop = () => {
      goalRef.current = null;
      api.getState().setTouring(false);
    };

    controls.addEventListener('start', stop);

    return () => controls.removeEventListener('start', stop);
  }, [controls, api]);

  useEffect(() => {
    if (!controls || !interactive) return;

    const onDoubleClick = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();

      if (rect.width < 1 || rect.height < 1) return;

      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);

      const hit =
        raycaster.intersectObjects(scene.children, true)[0]?.point ??
        raycaster.ray.intersectPlane(GROUND, new Vector3());

      if (!hit) return;

      const distance = camera.position.distanceTo(controls.target);

      flyTo(around(camera, controls, hit.clone(), Math.max(distance * DIVE.ratio, DIVE.min)));
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      const distance = camera.position.distanceTo(controls.target);
      const state = api.getState();

      if (e.code in VIEW_KEYS) {
        flyTo(around(camera, controls, controls.target.clone(), distance, VIEW_KEYS[e.code]));
      } else if (RESET_KEYS.has(e.code)) {
        flyTo(goalOf(model, state.view, aspectRef.current));
      } else if (FOCUS_KEYS.has(e.code)) {
        // 선택한 대상이 있으면 그 대상을, 없으면 지금 뷰의 전체를 화면에 맞춘다
        flyTo(
          state.selection
            ? selectionGoal(model, state.selection, camera, controls, aspectRef.current, root.current)
            : goalOf(model, state.view, aspectRef.current),
        );
      } else {
        return;
      }

      e.preventDefault();
    };

    gl.domElement.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('keydown', onKey);

    return () => {
      gl.domElement.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [controls, camera, gl, scene, raycaster, model, api, root, interactive, flyTo]);

  useFrame((_, dt) => {
    const g = goalRef.current;

    if (!g || !controls) return;

    const k = 1 - Math.exp(-dt * (g.speed ?? 3.2));

    camera.position.lerp(g.position, k);
    controls.target.lerp(g.target, k);
    controls.update();

    // 멈추는 기준은 보는 거리에 비례 — 부품처럼 1m 앞으로 다가갈 때 0.5m 고정이면 눈에 띄게 비켜 멈춘다
    const settle = Math.min(0.5, Math.max(0.005, g.position.distanceTo(g.target) * 0.01));

    if (camera.position.distanceTo(g.position) < settle && controls.target.distanceTo(g.target) < settle) {
      goalRef.current = null;
    } else {
      invalidate();
    }
  });

  return null;
}
