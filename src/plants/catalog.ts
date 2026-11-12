import { ASIAD_SPEC } from '@/plants/asiad/spec';
import { SAMPLE_SPEC } from '@/plants/sample/spec';
import type { PlantSpec } from '@/plants/types';

/** 등록된 발전소 — 목록 순서가 화면 순서다. 새 발전소는 여기와 plants/registry.ts 에 한 줄씩 더한다 */
export const PLANT_SPECS: PlantSpec[] = [ASIAD_SPEC, SAMPLE_SPEC];

const BY_ID = new Map(PLANT_SPECS.map((spec) => [spec.id, spec]));

export const getPlantSpec = (plantId: string | undefined): PlantSpec | undefined =>
  plantId ? BY_ID.get(plantId) : undefined;

export const DEFAULT_PLANT_ID = PLANT_SPECS[0].id;
