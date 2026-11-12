import { PATH } from './routes';

const depth = (base: string, plantId?: string | null, unitId?: string | null, no?: number | null) => {
  if (!plantId) return base;
  if (!unitId || no == null) return `${base}/${plantId}`;

  return `${base}/${plantId}/${unitId}/${no}`;
};

/** 뎁스 경로 빌더 — 발전소만 주면 발전소 단, 호기·인버터까지 주면 인버터 단이다 */
export const buildPath = {
  statistics: (plantId?: string | null, unitId?: string | null, no?: number | null) =>
    depth(PATH.STATISTICS, plantId, unitId, no),
  diagnosis: (plantId?: string | null, unitId?: string | null, no?: number | null) =>
    depth(PATH.DIAGNOSIS, plantId, unitId, no),
};
