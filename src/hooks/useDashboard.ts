/**
 * Hook for Dashboard API
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { handleError } from '@/lib/error-handler';

export interface DashboardStats {
  interacoes: number;
  leads: number;
  taxa_conclusao: number;
  nichos_ativos: number;
}

export interface ActivityData {
  name: string;
  value: number;
}

export interface NicheData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  stats: DashboardStats;
  activity: ActivityData[];
  niches: NicheData[];
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        return await apiClient.get<DashboardData>('/api/v1/dashboard');
      } catch (err) {
        handleError(err, 'Falha ao carregar dashboard');
        throw err;
      }
    },
  });
}
