import { useQuery } from '@tanstack/react-query';
import { getInverterEquipment } from '@/service/equipment';
import { queryKey } from './queryKey';

export const useInverterEquipment = (plantId: string, unitId: string, no: number) =>
  useQuery({
    queryKey: queryKey.equipment.inverter(plantId, unitId, no),
    queryFn: () => getInverterEquipment(plantId, unitId, no),
    enabled: plantId !== '' && unitId !== '',
  });
