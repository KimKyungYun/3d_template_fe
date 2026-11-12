import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { STATUS_META } from '@/configs/status';
import { fitDistance, reducedMotion } from '@/plants/builders/camera';
import { sweepRangeOf } from '@/plants/builders/alerts';
import { getAlerts } from '@/service/plant';
import type { EquipmentAlert } from '@/interface/diagnosis';
import { useAlertShader, useLabelRegistry, usePlantModel, useSceneApi } from '../SceneContext';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/*
  연출 타임라인 (초). 한 바퀴가 끝나면 스캔부터 다시 돈다 — 하늘에서 내려앉는 것은 첫 바퀴만.
    0.0 ─ 하늘에서 발전소로 내려앉는다 (DESCEND)
    1.4 ─ 햇빛 반사 띠가 남서→북동으로 패널을 쓸고 지나간다 (SWEEP)
    3.8 ─ 패널이 한 장씩 스캔된다. 이상 모듈은 스캔이 지나는 순간 상태색으로 켜진다 (SEQ)
    7.4 ─ 이상 지점마다 이름표가 하나씩 떠오른다 (CARD_GAP 간격)
   15.0 ─ 이름표가 걷히고 확인 빛이 꺼지며 처음으로 (LOOP)
*/
const DESCEND = 3.4;
const SWEEP_START = 1.4;
const SWEEP_DURATION = 2.8;
const SEQ_START = 3.8;
const SEQ_DURATION = 3.4;
const CARDS_START = 7.4;
const CARD_GAP = 0.55;
const FADE_START = 13.6;
const LOOP = 15;

/** 천천히 도는 빠르기 (rad/s) */
const ORBIT_SPEED = 0.028;

const SWEEP_COLOR = { light: '#fff1c9', dark: '#ffd27a' } as const;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** 연출에 띄울 이상 — 고장부터, 같은 상태면 서쪽부터 (스캔이 지나가는 순서) */
const byShowOrder = (a: EquipmentAlert, b: EquipmentAlert) => STATUS_META[a.status].rank - STATUS_META[b.status].rank;

/** 진행 표시 DOM 키 — 오버레이의 DirectorReadout 이 등록하고, 감독이 매 프레임 글자를 바꾼다 */
export const DIRECTOR_READOUT_KEY = 'director:readout';

const formatCount = (n: number) => n.toLocaleString('ko-KR');

export interface DirectorProps {
  /** 화면에서 발전소가 놓일 자리 — 오른쪽에 카드가 있으면 음수로 왼쪽으로 민다 (반경 비율) */
  shiftX?: number;
  /** 양수면 발전소를 화면 위쪽으로 올린다 — 아래에 글자가 놓이는 자리 (반경 비율) */
  shiftY?: number;
  /** 화면 높이에서 내려다보는 각 (rad, 수평 0) */
  elevation?: number;
  /** 카메라 거리 배율 — 1 이면 전체가 꽉 찬다 */
  zoom?: number;
  /** 띄울 이름표 최대 장수 */
  maxCards?: number;
}

/**
 * 로그인·배너용 연출 감독. PlantStage(backdrop) 의 Canvas 안에 둔다.
 * 카메라·셰이더·이름표를 시간표대로 움직이고, 매 프레임 다음 프레임을 요청한다.
 * 동작 줄이기면 스캔이 끝난 정지 화면 하나만 그린다
 */
export function Director({ shiftX = -0.14, shiftY = 0.2, elevation = 0.64, zoom = 0.98, maxCards = 6 }: DirectorProps) {
  const theme = useResolvedTheme();
  const model = usePlantModel();
  const api = useSceneApi();
  const shader = useAlertShader();
  const labels = useLabelRegistry();
  const phaseRef = useRef('');
  const [moduleTotal] = useState(() => model.unitIds.reduce((sum, id) => sum + model.units[id].modules.matrices.length, 0));
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  const [still] = useState(reducedMotion);
  const [sweep] = useState(() => sweepRangeOf(model));
  const startRef = useRef<number | null>(null);
  const cardsRef = useRef(0);
  const target = useRef(new Vector3());
  const offset = useRef(new Vector3());
  const right = useRef(new Vector3());
  const toward = useRef(new Vector3());

  // 이상 목록은 한 번 읽어 고장부터 줄 세운다. 카드는 0장부터 시작
  useEffect(() => {
    let alive = true;

    getAlerts(model.id).then((alerts) => {
      if (!alive) return;

      const { commitAlerts, setCardLimit } = api.getState();

      commitAlerts([...alerts].sort(byShowOrder).slice(0, maxCards));
      setCardLimit(still ? maxCards : 0);
      invalidate();
    });

    return () => {
      alive = false;
    };
  }, [api, model.id, maxCards, still, invalidate]);

  useEffect(() => {
    shader.setSweep(false, 0, SWEEP_COLOR[theme]);
  }, [shader, theme]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;

    if (startRef.current === null) startRef.current = now;

    const elapsed = now - startRef.current;
    const firstLap = elapsed < LOOP;
    const t = still ? LOOP * 0.7 : elapsed % LOOP;

    // ── 카메라: 천천히 돌며, 첫 바퀴에는 하늘에서 내려앉는다 ──
    const { overview } = model;
    const aspect = size.width / Math.max(1, size.height);
    const distance = fitDistance(overview.radius, aspect) * zoom;
    const descend = still || !firstLap ? 1 : easeInOut(clamp01(elapsed / DESCEND));
    const angle = -0.6 + (still ? 0 : elapsed * ORBIT_SPEED);
    const pitch = elevation + (1 - descend) * (Math.PI / 2 - 0.08 - elevation);
    const dist = distance * (1 + (1 - descend) * 1.4);

    offset.current.set(
      Math.sin(angle) * Math.cos(pitch) * dist,
      Math.sin(pitch) * dist,
      Math.cos(angle) * Math.cos(pitch) * dist,
    );

    // 발전소를 화면 한쪽으로 민다 — 회전 중심을 카메라 오른쪽·카메라 쪽으로 옮긴다
    right.current.set(Math.cos(angle), 0, -Math.sin(angle));
    toward.current.set(Math.sin(angle), 0, Math.cos(angle));
    target.current
      .set(overview.target[0], 0, overview.target[2])
      .addScaledVector(right.current, -shiftX * overview.radius)
      .addScaledVector(toward.current, shiftY * overview.radius);
    camera.position.copy(target.current).add(offset.current);

    if (controls) {
      controls.target.copy(target.current);
      controls.update();
    } else {
      camera.lookAt(target.current);
    }

    // ── 햇빛 반사 띠 ──
    const sweepT = (t - SWEEP_START) / SWEEP_DURATION;
    const sweeping = !still && sweepT > 0 && sweepT < 1;

    shader.setSweep(sweeping, sweep.from + (sweep.to - sweep.from) * easeInOut(clamp01(sweepT)));

    // ── 한 장씩 스캔 + 이상 점등 ──
    const seq = still ? 1.1 : clamp01((t - SEQ_START) / SEQ_DURATION) * 1.1;
    const fade = still ? 1 : 1 - clamp01((t - FADE_START) / (LOOP - FADE_START));
    const checked = seq > 0 ? fade * easeOut(clamp01((t - SEQ_START) / 1)) : 0;

    shader.setShow(true, t >= FADE_START + (LOOP - FADE_START) * 0.85 ? 0 : seq, checked);

    // ── 이름표 하나씩 ──
    if (!still) {
      const cards = t < CARDS_START || t >= FADE_START ? 0 : Math.min(maxCards, Math.floor((t - CARDS_START) / CARD_GAP) + 1);

      if (cards !== cardsRef.current) {
        cardsRef.current = cards;
        api.getState().setCardLimit(cards);
      }
    }

    // ── 진행 표시 — 바뀔 때만 글자를 고친다 ──
    const readout = labels.get(DIRECTOR_READOUT_KEY);

    if (readout) {
      const scanned = Math.round(moduleTotal * clamp01(seq / 1.1));
      const phase = t < SEQ_START
        ? 'ALIGN'
        : t < CARDS_START
          ? 'SCAN'
          : t < FADE_START ? 'DETECT' : 'STANDBY';
      const text = phase === 'SCAN'
        ? `MODULE SCAN ${formatCount(scanned)} / ${formatCount(moduleTotal)}`
        : phase === 'DETECT'
          ? `ANOMALY ${cardsRef.current} / ${maxCards} DETECTED`
          : phase === 'ALIGN' ? 'SUN TRACKING · CALIBRATING' : 'STANDBY · NEXT SCAN';
      const key = `${phase}|${text}`;

      if (key !== phaseRef.current) {
        phaseRef.current = key;
        readout.dataset.phase = phase.toLowerCase();
        readout.textContent = text;
      }
    }

    invalidate();
  });

  return null;
}
