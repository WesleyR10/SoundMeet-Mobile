import { useQuery } from '@tanstack/react-query';
import { getAudienceRequests } from '../infrastructure/request.api';

export const audienceRequestsKey = (audienceId: string) =>
  ['requests', 'audience', audienceId] as const;

/**
 * Os pedidos do próprio fã.
 *
 * Serve o cold start do destaque: o `pending-boost.store` é memória pura (um
 * QR em cache de disco poderia ressuscitar vencido), então quem fecha o app
 * perde a pendência. Esta lista é o que a devolve.
 */
export function useAudienceRequests(audienceId: string | null) {
  return useQuery({
    queryKey: audienceId
      ? audienceRequestsKey(audienceId)
      : ['requests', 'audience', 'disabled'],
    queryFn: () => getAudienceRequests(audienceId!),
    enabled: !!audienceId,
    staleTime: 30 * 1_000,
  });
}
