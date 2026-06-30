import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/services/http/types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   5 * 60 * 1_000,  // 5 min — dados frescos sem refetch
      gcTime:      10 * 60 * 1_000, // 10 min — cache após unmount (sobrevive troca de aba)
      networkMode: 'offlineFirst',   // mobile vai offline; não falha imediatamente
      retry: (failureCount, error) => {
        // Não retentar erros 4xx — são do cliente (auth, validação, not found)
        if (isApiError(error)) {
          const status = error.response?.status;
          if (status !== undefined && status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      retryDelay:           (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false, // mobile não tem "foco de janela"
      refetchOnReconnect:   true,
      refetchOnMount:       true,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 0,
    },
  },
});
