import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPlantSpec } from '@/plants/catalog';
import { useSetPlantId } from '@/stores/plantStore';
import type { PlantSpec } from '@/plants/types';

export interface PlantScope {
  plantId: string | undefined;
  spec: PlantSpec | undefined;
  unitId: string | undefined;
  no: number | undefined;
  /** 어느 뎁스를 그릴지 — 주소가 틀리면 invalid */
  depth: 'empty' | 'plant' | 'inverter' | 'invalid';
}

/**
 * 뎁스 주소(`/:plantId/:unitId/:no`)를 읽어 조회 범위로 바꾼다.
 * 주소의 발전소를 마지막으로 본 발전소로 기억해, 다른 메뉴로 옮겨도 같은 발전소로 들어가게 한다.
 */
export function usePlantScope(): PlantScope {
  const params = useParams<{ plantId?: string; unitId?: string; no?: string }>();
  const setPlantId = useSetPlantId();
  const spec = getPlantSpec(params.plantId);
  const no = params.no ? Number(params.no) : undefined;
  const inverterExists = !!spec?.units.find((u) => u.id === params.unitId)?.inverters.some((i) => i.no === no);

  useEffect(() => {
    if (spec) setPlantId(spec.id);
  }, [spec, setPlantId]);

  let depth: PlantScope['depth'] = 'empty';

  if (params.plantId && !spec) depth = 'invalid';
  else if (spec && params.unitId) depth = inverterExists ? 'inverter' : 'invalid';
  else if (spec) depth = 'plant';

  return { plantId: spec?.id, spec, unitId: params.unitId, no, depth };
}
