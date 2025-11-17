/**
 * Hook for Leads API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { handleError } from '@/lib/error-handler';

export interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  nicho: string;
  data: string;
  status?: string;
}

export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        return await apiClient.get<Lead[]>('/api/v1/leads');
      } catch (err) {
        handleError(err, 'Falha ao carregar leads');
        throw err;
      }
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      return await apiClient.post<Lead>('/api/v1/leads', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err) => {
      handleError(err, 'Falha ao criar lead');
    },
  });
}
