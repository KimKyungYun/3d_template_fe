/** 쿼리 키 팩토리 — 키를 손으로 적지 않고 여기서만 만든다 */
export const queryKey = {
  plants: {
    all: ['plants'] as const,
    overviews: () => [...queryKey.plants.all, 'overviews'] as const,
    diagnosis: (plantId: string) => [...queryKey.plants.all, plantId, 'diagnosis'] as const,
    alerts: (plantId: string) => [...queryKey.plants.all, plantId, 'alerts'] as const,
  },
  equipment: {
    inverter: (plantId: string, unitId: string, no: number) => ['equipment', plantId, unitId, no] as const,
  },
  generation: {
    all: ['generation'] as const,
    today: (plantId: string) => [...queryKey.generation.all, plantId, 'today'] as const,
    stats: (plantId: string, period: string, date: string) =>
      [...queryKey.generation.all, plantId, 'stats', period, date] as const,
    inverter: (plantId: string, unitId: string, no: number, period: string, date: string) =>
      [...queryKey.generation.all, plantId, 'inverter', unitId, no, period, date] as const,
  },
};
