/*
  씬 한 벌이 나눠 쓰는 것 — 스토어, 발전소 모델, 이름표 DOM 레지스트리, 셰이더 유니폼, 루트 엘리먼트.
  모두 씬마다 따로 둔다. 전역으로 두면 3D 가 둘 이상 뜨는 순간 서로를 덮어쓴다.
*/
import { createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { createAlertShader } from '@/plants/builders/alerts';
import type { AlertShader } from '@/plants/builders/alerts';
import type { PlantModel } from '@/plants/model/types';
import { createSceneStore } from './store';
import type { ReactNode, RefObject } from 'react';
import type { SceneState, SceneStore } from './store';

interface SceneContextValue {
  store: SceneStore;
  model: PlantModel;
  /** 이름표 DOM — 오버레이가 등록하고, 캔버스 안의 프로젝터가 매 프레임 위치를 옮긴다 */
  labels: Map<string, HTMLElement>;
  shader: AlertShader;
  /** 이 씬의 루트 — HUD 패널([data-hud])을 이 안에서만 찾는다 */
  root: RefObject<HTMLDivElement | null>;
}

const SceneContext = createContext<SceneContextValue | null>(null);

interface SceneProviderProps {
  model: PlantModel;
  root: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

/** 씬 하나의 울타리 — 발전소가 바뀌면 PlantStage 가 key 로 이 울타리를 새로 세운다 */
export function SceneProvider({ model, root, children }: SceneProviderProps) {
  const [value] = useState<SceneContextValue>(() => ({
    store: createSceneStore(),
    model,
    labels: new Map<string, HTMLElement>(),
    shader: createAlertShader(),
    root,
  }));

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

function useSceneContext(): SceneContextValue {
  const value = useContext(SceneContext);

  if (!value) throw new Error('씬 컴포넌트는 SceneProvider(PlantStage) 안에서만 쓸 수 있습니다.');

  return value;
}

/** 씬 상태 구독 */
export function useScene<T>(selector: (state: SceneState) => T): T {
  return useStore(useSceneContext().store, selector);
}

/** 구독 없이 상태를 읽거나 액션을 부를 때 (getState·setState) */
export const useSceneApi = (): SceneStore => useSceneContext().store;

export const usePlantModel = (): PlantModel => useSceneContext().model;

export const useLabelRegistry = () => useSceneContext().labels;

export const useAlertShader = (): AlertShader => useSceneContext().shader;

export const useSceneRoot = () => useSceneContext().root;

/** 이름표 요소를 레지스트리에 걸고 떼는 ref 콜백 */
export function useLabelRef(key: string) {
  const labels = useLabelRegistry();

  return (el: HTMLElement | null) => {
    if (el) labels.set(key, el);
    else labels.delete(key);
  };
}
