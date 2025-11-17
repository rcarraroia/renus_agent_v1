/**
 * Hook for Funcionalidades API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { handleError } from '@/lib/error-handler';

export interface Funcionalidade {
  id: number;
  nome: string;
  descricao: string;
  prioridade: string;
  votos: number;
  nicho: string;
}

export interface AgentConfig {
  id?: string;
  prompt_principal: string;
  identidade: string;
  objetivo: string;
  modo_comunicacao: string;
  tools: Tool[];
  knowledge_base: KnowledgeItem[];
  triggers: Trigger[];
}

export interface Tool {
  name: string;
  status: string;
  config?: Record<string, any>;
}

export interface KnowledgeItem {
  title: string;
  type: string;
  size: string;
  date: string;
  url?: string;
}

export interface Trigger {
  name: string;
  description: string;
  event_type: string;
  active: boolean;
}

export function useFuncionalidades() {
  return useQuery<Funcionalidade[]>({
    queryKey: ['funcionalidades'],
    queryFn: async () => {
      try {
        return await apiClient.get<Funcionalidade[]>('/api/v1/funcionalidades');
      } catch (err) {
        handleError(err, 'Falha ao carregar funcionalidades');
        throw err;
      }
    },
  });
}

export function useAgentConfig() {
  return useQuery<AgentConfig>({
    queryKey: ['agent-config'],
    queryFn: async () => {
      try {
        return await apiClient.get<AgentConfig>('/api/v1/funcionalidades/config');
      } catch (err) {
        handleError(err, 'Falha ao carregar configuração do agente');
        throw err;
      }
    },
  });
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<AgentConfig>) => {
      return await apiClient.put<AgentConfig>('/api/v1/funcionalidades/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-config'] });
    },
    onError: (err) => {
      handleError(err, 'Falha ao atualizar configuração do agente');
    },
  });
}
