import { useEffect, useRef, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { MOUSE } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { CAMERA_FOV, initialCamera, introPosition, reducedMotion } from '@/plants/builders/camera';
import { SCENE_COLORS, SCENERY_COLORS } from '@/plants/builders/colors';
import { SUN_DIR } from '@/plants/builders/scene';
import { getPlantModel } from '@/plants/registry';
import { cn } from '@/utils/cn';
import type { PlantModel } from '@/plants/model/types';
import AlertCards from '../Alerts';
import AlertDriver from '../Alerts/AlertDriver';
import AlertScanner from '../Alerts/AlertScanner';
import AlertToast from '../Alerts/AlertToast';
import AxisGizmo from '../AxisGizmo';
import CableTray from '../CableTray';
import CameraRig from '../CameraRig';
import Compass from '../Compass';
import CompassDriver from '../Compass/CompassDriver';
import DepthRange from '../DepthRange';
import Equipment from '../Equipment';
import HoverTooltip from '../HoverTooltip';
import KeyboardMove from '../KeyboardMove';
import LabelProjector from '../LabelProjector';
import ModuleField from '../ModuleField';
import RouteGuide from '../RouteGuide';
import { EquipmentStations } from '../station/EquipmentStations';
import { PartCard } from '../station/PartCard';
import { ViewReset } from '../ViewReset';
import SceneLabels from '../SceneLabels';
import { SceneProvider, usePlantModel, useSceneApi } from '../SceneContext';
import SelectionCard from '../SelectionCard';
import SelectionGlow from '../SelectionGlow';
import SiteGround from '../SiteGround';
import StructureFrame from '../StructureFrame';
import WiringTrace from '../WiringTrace';
import styles from './PlantStage.module.scss';
import type { ReactNode, RefObject } from 'react';

const SHADOW_EXTENT = 420;
/** 웹 3D 뷰어 표준 배치 — 좌: 회전, 휠 클릭·우: 이동 (휠 굴림은 커서 방향 확대) */
const MOUSE_BUTTONS = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN };

/** 첫 진입 연출은 세션에 한 번만 — 화면을 오가며 되풀이되지 않게 */
let introPlayed = false;

export interface PlantStageProps {
  plantId: string;
  /** 다른 화면 한쪽에 넣는 모드 — 장소 이름표·축 표시·키보드 이동을 뺀다 (선택·호버 카드는 남긴다) */
  compact?: boolean;
  /** false 면 시점 조작·클릭·호버를 모두 끈다 (로그인 배경처럼 구경만 하는 자리) */
  interactive?: boolean;
  /** false 면 주기 스캔과 이상 이름표·알림을 띄우지 않는다 */
  showAlerts?: boolean;
  /**
   * 배경 모드 (로그인·배너) — 조작·주기 스캔·알림·나침반·장소 이름표·선택 카드를 모두 빼고,
   * 카메라와 스캔은 children 으로 넣은 Director 가 맡는다
   */
  backdrop?: boolean;
  /** 첫 프레임이 화면에 올라간 뒤 한 번 — 첫 화면(스플래시)을 걷어 내는 자리 */
  onReady?: () => void;
  /** Canvas 안에 더 넣을 R3F 노드 */
  children?: ReactNode;
  /** 캔버스 위에 겹칠 DOM — HUD 패널을 여기 넘기면 카드·카메라가 그 패널을 피한다 */
  overlay?: ReactNode;
  className?: string;
}

/**
 * 발전소 3D 스테이지. 발전소가 바뀌면 스토어·카메라를 처음부터 다시 세운다(key).
 * 3D 모델이 등록되지 않은 발전소면 오버레이만 올린다
 */
export function PlantStage({ plantId, ...rest }: PlantStageProps) {
  const model = getPlantModel(plantId);

  if (!model) {
    return <div className={cn(styles.stage, { [rest.className ?? '']: !!rest.className })}>{rest.overlay}</div>;
  }

  return <Stage key={model.id} model={model} {...rest} />;
}

type StageProps = Omit<PlantStageProps, 'plantId'> & { model: PlantModel };

function Stage({ model, ...rest }: StageProps) {
  const root = useRef<HTMLDivElement>(null);

  return (
    <SceneProvider model={model} root={root}>
      <StageBody root={root} {...rest} />
    </SceneProvider>
  );
}

type StageBodyProps = Omit<StageProps, 'model'> & { root: RefObject<HTMLDivElement | null> };

/** 캔버스와 오버레이를 담는 루트 — 이름표·카메라가 이 안의 [data-hud] 만 피한다 */
function StageBody({
  root,
  compact = false,
  interactive: interactiveProp = true,
  showAlerts = true,
  backdrop = false,
  onReady,
  children,
  overlay,
  className,
}: StageBodyProps) {
  const model = usePlantModel();
  const api = useSceneApi();
  const theme = useResolvedTheme();
  const interactive = interactiveProp && !backdrop;
  const decor = !backdrop;
  // 배경 연출을 휴대폰에서 돌릴 때는 저사양으로 — 해상도 1배, 그림자 없음
  const [lowPower] = useState(() => backdrop && window.matchMedia('(width <= 600px)').matches);
  const colors = SCENE_COLORS[theme];
  const scenery = SCENERY_COLORS[theme];
  const [initial] = useState(() => initialCamera(model));
  // 세션 첫 큰 도면만 높은 하늘에서 내려온다 (작은 도면·동작 줄이기는 바로 시작 시점)
  const [intro] = useState(() => !compact && interactive && !introPlayed && !reducedMotion());
  const [startPosition] = useState(() => (intro ? introPosition(initial) : initial.position));
  const center = initial.target;

  useEffect(() => {
    if (intro) introPlayed = true;
  }, [intro]);

  const leave = () => {
    api.getState().clearHover();
    document.body.style.cursor = '';
  };

  return (
    <div
      ref={root}
      className={cn(styles.stage, { [className ?? '']: !!className })}
      // 패널 위로 커서가 넘어가면 3D 쪽 pointerout 이 오지 않을 수 있어, 캔버스를 벗어날 때 직접 지운다
      onPointerLeave={interactive ? leave : undefined}
    >
      {/* 캔버스 칸 — 페이지가 --stage-canvas-bottom 으로 아래를 비울 수 있다 (휴대폰에서 아래를 정보창에 내줄 때) */}
      <div className={styles.stage__canvas}>
        <Canvas
          shadows={lowPower ? false : 'percentage'}
          frameloop="demand"
          dpr={lowPower ? 1 : [1, 1.5]}
          gl={{ powerPreference: 'high-performance', stencil: false }}
          onCreated={({ gl }) => {
          // 받침판 가장자리 클리핑(재질별 clippingPlanes)을 켠다
            gl.localClippingEnabled = true;
          }}
          camera={{ fov: CAMERA_FOV, near: 1, far: 14000, position: startPosition.toArray() }}
          /*
          빈 곳 왼쪽 클릭만 선택을 푼다 — 우클릭(contextmenu)은 macOS 에서 누르는 순간 와서,
          이동하려고 끌기 전에 선택 카드가 닫힌다
        */
          onPointerMissed={(e) => {
            if (interactive && e.button === 0) api.getState().select(null);
          }}
        >
          <color attach="background" args={[scenery.skyHorizon]} />
          <hemisphereLight args={[colors.hemiSky, colors.hemiGround, theme === 'dark' ? 1.05 : 1.15]} />
          <directionalLight
            castShadow
            color={scenery.sun}
            position={[center.x + SUN_DIR[0] * 500, SUN_DIR[1] * 500, center.z + SUN_DIR[2] * 500]}
            intensity={theme === 'dark' ? 1.3 : 2.3}
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0005}
            shadow-normalBias={0.35}
            shadow-camera-left={-SHADOW_EXTENT}
            shadow-camera-right={SHADOW_EXTENT}
            shadow-camera-top={SHADOW_EXTENT}
            shadow-camera-bottom={-SHADOW_EXTENT}
            shadow-camera-far={1500}
          >
            <object3D attach="target" position={[center.x, 0, center.z]} />
          </directionalLight>

          <SceneUnits interactive={interactive} />

          <OrbitControls
            makeDefault
            enableDamping
            enabled={interactive}
            dampingFactor={0.1}
            zoomSpeed={0.55}
            rotateSpeed={0.8}
            zoomToCursor
            mouseButtons={MOUSE_BUTTONS}
            screenSpacePanning
            panSpeed={1.2}
            minDistance={1}
            maxDistance={3000}
            minPolarAngle={0.01}
            maxPolarAngle={Math.PI - 0.01}
          />
          {decor && <CameraRig intro={intro} interactive={interactive} />}
          <DepthRange />
          {!compact && interactive && <KeyboardMove />}
          {!compact && decor && <AxisGizmo />}
          <LabelProjector />
          {decor && <CompassDriver />}
          {showAlerts && <AlertDriver />}
          {showAlerts && decor && <AlertScanner />}
          {onReady && <SceneReady onReady={onReady} />}
          {children}
        </Canvas>
      </div>
      {overlay}
      {!compact && decor && <SceneLabels />}
      {showAlerts && <AlertCards interactive={interactive} />}
      {showAlerts && decor && <AlertToast />}
      {decor && <Compass />}
      {decor && interactive && <ViewReset />}
      {decor && <SelectionCard />}
      {interactive && <PartCard />}
      {interactive && <HoverTooltip />}
    </div>
  );
}

interface SceneUnitsProps {
  interactive: boolean;
}

/** 주변 환경과 호기별 3D — 호기 순회는 모델의 unitIds 순서로 */
function SceneUnits({ interactive }: SceneUnitsProps) {
  const model = usePlantModel();
  const { Environment } = model;

  return (
    <>
      <Environment />
      {model.unitIds.map((unitId) => (
        <group key={unitId} position={model.units[unitId].origin}>
          <SiteGround unitId={unitId} />
          <StructureFrame unitId={unitId} />
          <ModuleField unitId={unitId} interactive={interactive} />
          <SelectionGlow unitId={unitId} />
          <CableTray unitId={unitId} interactive={interactive} />
          <Equipment unitId={unitId} interactive={interactive} />
          <WiringTrace unitId={unitId} />
          <RouteGuide unitId={unitId} />
          {interactive && <EquipmentStations unitId={unitId} />}
        </group>
      ))}
    </>
  );
}

interface SceneReadyProps {
  onReady: () => void;
}

/** 첫 프레임이 화면에 올라간 뒤(두 번째 프레임에서) 한 번 알린다 */
function SceneReady({ onReady }: SceneReadyProps) {
  const frames = useRef(0);

  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) onReady();
  });

  return null;
}
