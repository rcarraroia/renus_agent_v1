/**
 * Hook for Feedbacks API
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { handleError } from '@/lib/error-handler';

export interface Feedback {
  id: number;
  leadId: number;
  tipo: string;
  comentario: string;
  data: string;
  nicho: string;
}

export function useFeedbacks() {
  return useQuery<Feedback[]>({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      try {
        return await apiClient.get<Feedback[]>('/api/v1/feedbacks');
      } catch (err) {
        handleError(err, 'Falha ao carregar feedbacks');
        throw err;
      }
    },
  });
}
