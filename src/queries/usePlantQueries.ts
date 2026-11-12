import { useQuery } from '@tanstack/react-query';
import { getAlerts, getInverterDiagnosis, getPlantOverviews } from '@/service/plant';
import { queryKey } from './queryKey';

export const usePlantOverviews = () =>
  useQuery({ queryKey: queryKey.plants.overviews(), queryFn: getPlantOverviews });

export const useInverterDiagnosis = (plantId: string) =>
  useQuery({ queryKey: queryKey.plants.diagnosis(plantId), queryFn: () => getInverterDiagnosis(plantId) });

export const useAlerts = (plantId: string) =>
  useQuery({ queryKey: queryKey.plants.alerts(plantId), queryFn: () => getAlerts(plantId) });
