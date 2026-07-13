import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { acceptRequest, listRequests, rejectRequest } from '../infrastructure/request.api';
import type { RequestStatus } from '../domain/request.types';

export const musicianRequestsKey = (musicianId: string, status: RequestStatus | 'all') =>
  ['musician', musicianId, 'requests', status] as const;

// staleTime mais curto que useMusician (30s) — essa tela é sensível a tempo,
// pedidos entram/saem durante o show.
export function useRequests(musicianId: string | null, status: RequestStatus | 'all' = 'pending') {
  return useQuery({
    queryKey:  musicianId ? musicianRequestsKey(musicianId, status) : ['musician', 'requests', 'disabled'],
    queryFn:   () => listRequests(musicianId!, status),
    enabled:   !!musicianId,
    staleTime: 10_000,
  });
}

// Invalidação dentro do próprio mutation hook — desvio deliberado do padrão
// "mutation fina" visto em useUpdateMusicianProfile.ts: lá a invalidação vive
// numa camada orquestradora de tela (useEditProfileForm.ts) que não existe
// pro Bloco 4, então faz sentido morar aqui.
export function useAcceptRequest(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => acceptRequest(requestId),
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: musicianRequestsKey(musicianId, 'pending') });
    },
  });
}

export function useRejectRequest(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => rejectRequest(requestId),
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: musicianRequestsKey(musicianId, 'pending') });
    },
  });
}
