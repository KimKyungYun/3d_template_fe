import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_PLANT_ID, getPlantSpec } from '@/plants/catalog';

interface PlantState {
  /** 마지막으로 본 발전소 — 메뉴를 옮겨도 같은 발전소로 들어간다 */
  plantId: string;
  setPlantId: (plantId: string) => void;
}

const usePlantStore = create<PlantState>()(
  persist(
    (set) => ({
      plantId: DEFAULT_PLANT_ID,
      setPlantId: (plantId) => {
        if (getPlantSpec(plantId)) set({ plantId });
      },
    }),
    {
      name: 'solar3d-plant',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // 등록에서 빠진 발전소가 저장돼 있으면 기본 발전소로 되돌린다
      merge: (persisted, current) => {
        const saved = (persisted as Partial<PlantState> | undefined)?.plantId;

        return { ...current, plantId: saved && getPlantSpec(saved) ? saved : DEFAULT_PLANT_ID };
      },
    },
  ),
);

export const usePlantId = () => usePlantStore((state) => state.plantId);

export const useSetPlantId = () => usePlantStore((state) => state.setPlantId);

export const getPlantId = () => usePlantStore.getState().plantId;
