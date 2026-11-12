/*
  3D 모델 등록소. 발전소를 더할 때 catalog.ts(사양)와 여기(3D)에 한 줄씩 더한다.

  모델 만들기는 가대 수만 장·결선 그래프·부지 지오메트리를 한꺼번에 계산하는 일이라,
  모듈을 불러오는 시점에 돌리지 않고 그 발전소를 처음 그릴 때 한 번만 돌려 담아 둔다.
*/
import { buildAsiadModel } from '@/plants/asiad/model';
import { attachRtu } from '@/plants/builders/fieldGuide';
import { buildSampleModel } from '@/plants/sample/model';
import { ASIAD_PLANT_ID } from '@/plants/asiad/spec';
import { SAMPLE_PLANT_ID } from '@/plants/sample/spec';
import type { PlantModel } from '@/plants/model/types';

const BUILDERS: Record<string, () => PlantModel> = {
  [ASIAD_PLANT_ID]: buildAsiadModel,
  [SAMPLE_PLANT_ID]: buildSampleModel,
};

const CACHE = new Map<string, PlantModel>();

/** 발전소 3D 모델 — 처음 부를 때 만들고 담아 둔다. 3D 가 없는 발전소면 undefined */
export function getPlantModel(plantId: string | undefined): PlantModel | undefined {
  if (!plantId) return undefined;

  const cached = CACHE.get(plantId);

  if (cached) return cached;

  const build = BUILDERS[plantId];

  if (!build) return undefined;

  const model = build();

  // 도면에 없는 RTU 함은 어느 발전소든 전기실 옆 개략 자리에 세운다
  attachRtu(model);
  CACHE.set(plantId, model);

  return model;
}
