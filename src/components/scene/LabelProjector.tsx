import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { alertAnchor, alertLabelKey } from '@/plants/builders/alerts';
import { HOVER_LABEL_KEY, SELECTION_LABEL_KEY, selectionAnchor } from '@/plants/builders/labels';
import { EXPLODE_LIFT } from '@/plants/builders/scene';
import type { Vec3 } from '@/plants/model/types';
import { useLabelRegistry, usePlantModel, useScene, useSceneRoot } from './SceneContext';
import { PART_HOVER_KEY, PART_LABEL_KEY } from './station/PartCard';
import type { Camera } from 'three';

const v = new Vector3();
/** 카드가 캔버스 가장자리·패널에서 띄울 여백(px) */
const EDGE = 12;
/** 앵커 점과 카드 사이 줄기 길이 — AnchoredCard.module.scss 의 $stem 과 같다 */
const STEM = 18;
/** 쌓인 이름표 사이 간격(px) */
const STACK_GAP = 4;

type Labels = Map<string, HTMLElement>;

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface ViewSize {
  width: number;
  height: number;
}

const overlaps = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * 카드가 들어갈 가로 범위 — 카드 높이 구간에 걸치는 패널을 앵커 반대편 끝으로 삼는다.
 * 패널은 이 씬의 루트 안에서만 찾는다 (다른 화면의 패널을 피하려 들지 않도록)
 */
function freeSpan(root: HTMLElement | null, x: number, top: number, bottom: number, width: number) {
  let lo = EDGE;
  let hi = width - EDGE;

  if (!root) return [lo, hi] as const;

  const box = root.getBoundingClientRect();

  for (const panel of root.querySelectorAll<HTMLElement>('[data-hud]')) {
    const r = panel.getBoundingClientRect();
    const top0 = r.top - box.top;
    const bottom0 = r.bottom - box.top;

    if (r.width === 0 || bottom0 < top || top0 > bottom) continue;

    const left0 = r.left - box.left;
    const right0 = r.right - box.left;

    if (left0 + r.width / 2 < x) lo = Math.max(lo, right0 + EDGE);
    else hi = Math.min(hi, left0 - EDGE);
  }

  return [lo, hi] as const;
}

/**
 * 앵커 점이 화면 밖이거나 HUD 패널 밑에 깔렸는지 — 그런 카드는 띄우지 않는다.
 * 패널 위에 카드가 겹쳐 뜨면 패널 글자를 가리고, 줄기가 가리키는 점도 보이지 않는다
 */
function occluded(root: HTMLElement | null, x: number, y: number, size: ViewSize) {
  if (x < 0 || y < 0 || x > size.width || y > size.height) return true;
  if (!root) return false;

  const box = root.getBoundingClientRect();

  for (const panel of root.querySelectorAll<HTMLElement>('[data-hud]')) {
    const r = panel.getBoundingClientRect();
    const left = r.left - box.left;
    const top = r.top - box.top;

    if (x >= left && x <= left + r.width && y >= top && y <= top + r.height) return true;
  }

  return false;
}

/** 월드 좌표를 캔버스 화면 좌표로 — 카메라 뒤쪽이면 요소를 숨긴다 */
function project(el: HTMLElement, p: Vec3, camera: Camera, size: ViewSize) {
  v.set(p[0], p[1], p[2]).project(camera);
  el.style.visibility = v.z > 1 ? 'hidden' : '';

  return [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height] as const;
}

/**
 * 카드 루트는 앵커 점에 두고, 캔버스 끝·패널에 가리지 않게 상자를 좌우로 밀거나 아래로 뒤집는다.
 * avoid 를 주면 그 상자들과 겹치지 않을 때까지 줄기를 늘려 위로 올리고, 자리 잡은 상자를 거기에 더한다
 */
function placeCard(
  labels: Labels,
  root: HTMLElement | null,
  key: string,
  anchor: Vec3 | null,
  camera: Camera,
  size: ViewSize,
  avoid?: Rect[],
) {
  const card = labels.get(key);

  if (!card || !anchor) return;

  const [x, y] = project(card, anchor, camera, size);

  if (card.style.visibility !== 'hidden' && occluded(root, x, y, size)) card.style.visibility = 'hidden';

  card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;

  const box = card.lastElementChild as HTMLElement | null;

  if (!box) return;

  const w = box.offsetWidth;
  const h = box.offsetHeight;
  const below = y - STEM - h < EDGE;
  const top = below ? y + STEM : y - STEM - h;
  let [lo, hi] = freeSpan(root, x, top, top + h, size.width);

  // 패널 사이가 카드보다 좁으면(모바일 등) 캔버스 끝만 지킨다
  if (hi - lo < w) [lo, hi] = [EDGE, size.width - EDGE];

  const cx = Math.min(Math.max(x, lo + w / 2), hi - w / 2);

  card.style.setProperty('--shift', `${(cx - x).toFixed(1)}px`);
  card.dataset.below = String(below);

  if (!avoid) return;

  let lift = 0;

  if (!below && card.style.visibility !== 'hidden') {
    const rect = (): Rect => ({ left: cx - w / 2, right: cx + w / 2, top: top - lift, bottom: top - lift + h });

    // 겹치는 상자 위로 한 칸씩 올린다 (상자 수가 적어 단순 반복으로 충분하다)
    for (let guard = 0; guard < avoid.length; guard += 1) {
      const hit = avoid.find((r) => overlaps(rect(), r));

      if (!hit) break;
      lift = top + h - hit.top + STACK_GAP;
    }

    avoid.push(rect());
  }

  card.style.setProperty('--lift', `${lift.toFixed(1)}px`);
}

/** 이름표(고정 이름표 + 선택 카드·호버 툴팁·이상 이름표)의 월드 좌표를 화면 좌표로 투영해 DOM 요소를 옮긴다 */
export default function LabelProjector() {
  const model = usePlantModel();
  const labels = useLabelRegistry();
  const root = useSceneRoot();
  const selection = useScene((s) => s.selection);
  const explode = useScene((s) => s.explode);
  const alerts = useScene((s) => s.alerts.shown);
  const invalidate = useThree((s) => s.invalidate);
  // 커서가 떠난 뒤에도 마지막 자리에 두어야 옅어지는 애니메이션이 제자리에서 돈다
  const hoverAnchor = useScene((s) => s.hover.lastShown?.anchor ?? null);
  const partAnchor = useScene((s) => s.part.anchor);
  const partHoverAnchor = useScene((s) => s.part.hoverAnchor);

  const selectionPoint = useMemo(() => {
    const a = selectionAnchor(model, selection);

    // 분해 보기에서는 모듈이 들려 올라가므로 카드도 같이 올린다
    return a && selection?.kind === 'inverter' ? ([a[0], a[1] + explode * EXPLODE_LIFT.modules, a[2]] as Vec3) : a;
  }, [model, selection, explode]);

  const alertPoints = useMemo(
    () =>
      alerts.map((a) => {
        const p = alertAnchor(model, a);

        return [alertLabelKey(a), p && ([p[0], p[1] + explode * EXPLODE_LIFT.modules, p[2]] as Vec3)] as const;
      }),
    [model, alerts, explode],
  );

  // frameloop="demand" 라 호버 대상이 바뀌면 한 프레임 그려 툴팁을 새 자리로 옮긴다
  useEffect(() => invalidate(), [hoverAnchor, partAnchor, partHoverAnchor, invalidate]);

  useFrame(({ camera, size }) => {
    for (const l of model.labels) {
      const el = labels.get(l.key);

      if (!el) continue;

      const [x, y] = project(el, l.position, camera, size);

      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }

    placeCard(labels, root.current, SELECTION_LABEL_KEY, selectionPoint, camera, size);
    placeCard(labels, root.current, HOVER_LABEL_KEY, hoverAnchor, camera, size);
    placeCard(labels, root.current, PART_LABEL_KEY, partAnchor, camera, size);
    placeCard(labels, root.current, PART_HOVER_KEY, partHoverAnchor, camera, size);

    // 이상 이름표는 선택 카드와도, 서로와도 겹치지 않게 쌓는다
    const placed: Rect[] = [];
    const selectionBox = labels.get(SELECTION_LABEL_KEY)?.lastElementChild?.getBoundingClientRect();
    const canvasBox = labels.get(SELECTION_LABEL_KEY)?.parentElement?.getBoundingClientRect();

    if (selection && selectionBox && canvasBox) {
      placed.push({
        left: selectionBox.left - canvasBox.left,
        right: selectionBox.right - canvasBox.left,
        top: selectionBox.top - canvasBox.top,
        bottom: selectionBox.bottom - canvasBox.top,
      });
    }

    // 화면 아래쪽(가까운) 이름표부터 자리를 잡아 먼 쪽이 위로 쌓이게 한다
    const ordered = alertPoints
      .map(([key, point]) => {
        if (!point) return null;

        v.set(point[0], point[1], point[2]).project(camera);

        return { key, point, sy: v.y };
      })
      .filter((p) => p !== null)
      .sort((a, b) => a.sy - b.sy);

    for (const { key, point } of ordered) placeCard(labels, root.current, key, point, camera, size, placed);
  });

  return null;
}
