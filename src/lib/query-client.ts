/**
 * React Query Client Configuration
 * Centralized configuration for @tanstack/react-query
 */

import { QueryClient } from '@tanstack/react-query';
import { shouldRetryQuery, getRetryDelay } from './error-handler';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: shouldRetryQuery,
      retryDelay: (attemptIndex) => getRetryDelay(attemptIndex),

      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,

      // Refetch on window focus in production only
      refetchOnWindowFocus: import.meta.env.PROD,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: false,

      // Retry only network errors for mutations
      retryDelay: (attemptIndex) => getRetryDelay(attemptIndex),
    },
  },
});

export default queryClient;
