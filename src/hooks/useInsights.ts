/**
 * Hook for Insights API
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { handleError } from '@/lib/error-handler';

export interface InsightsData {
  resumo: string;
  recomendacoes: string;
  tendencias: string[];
}

export function useInsights() {
  return useQuery<InsightsData>({
    queryKey: ['insights'],
    queryFn: async () => {
      try {
        return await apiClient.get<InsightsData>('/api/v1/insights');
      } catch (err) {
        handleError(err, 'Falha ao carregar insights');
        throw err;
      }
    },
  });
}
