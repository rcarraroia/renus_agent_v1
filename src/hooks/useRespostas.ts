/**
 * Hook for Respostas API
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { handleError } from '@/lib/error-handler';

export interface Resposta {
  id: number;
  leadId: number;
  pergunta: string;
  resposta: string;
  nicho: string;
  data: string;
}

export function useRespostas(filters?: { nicho?: string; keyword?: string }) {
  return useQuery<Resposta[]>({
    queryKey: ['respostas', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.nicho) params.append('nicho', filters.nicho);
        if (filters?.keyword) params.append('keyword', filters.keyword);
        
        const url = `/api/v1/respostas${params.toString() ? `?${params.toString()}` : ''}`;
        return await apiClient.get<Resposta[]>(url);
      } catch (err) {
        handleError(err, 'Falha ao carregar respostas');
        throw err;
      }
    },
  });
}
