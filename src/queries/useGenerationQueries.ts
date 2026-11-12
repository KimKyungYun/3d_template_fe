import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getGenerationStats, getInverterStats, getTodayOutput } from '@/service/generation';
import type { StatPeriod } from '@/interface/generation';
import { queryKey } from './queryKey';

export const useTodayOutput = (plantId: string) =>
  useQuery({ queryKey: queryKey.generation.today(plantId), queryFn: () => getTodayOutput(plantId) });

/** 기간을 바꾸는 동안 이전 값을 붙들어 3D 색이 꺼졌다 켜지지 않게 한다 */
export const useGenerationStats = (plantId: string, period: StatPeriod, date: string) =>
  useQuery({
    queryKey: queryKey.generation.stats(plantId, period, date),
    queryFn: () => getGenerationStats(plantId, period, date),
    placeholderData: keepPreviousData,
    enabled: plantId !== '',
  });

export const useInverterStats = (plantId: string, unitId: string, no: number, period: StatPeriod, date: string) =>
  useQuery({
    queryKey: queryKey.generation.inverter(plantId, unitId, no, period, date),
    queryFn: () => getInverterStats(plantId, unitId, no, period, date),
    placeholderData: keepPreviousData,
  });
