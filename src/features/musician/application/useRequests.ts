import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { acceptRequest, batchRespondRequests, listRequests, rejectRequest } from '../infrastructure/request.api';
import type { RequestStatus, RespondToRequestAction } from '../domain/request.types';

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

export type BatchRespondVariables = {
  requestIds:       string[];
  action:           RespondToRequestAction;
  rejectionReason?: string;
};

/**
 * Responder vários pedidos de uma vez.
 *
 * 🔴 **`onSuccess` aqui NÃO significa "todos responderam".** A rota é
 * best-effort e devolve 200 com `failed` preenchido quando parte do lote não
 * passou (pedido já respondido em outro aparelho, expirado, de outro músico).
 * Por isso a invalidação roda sempre — os que passaram têm de sair da fila — e
 * quem interpreta `failed` é a tela, que precisa manter os que falharam
 * visíveis com o motivo. Tratar isto como sucesso binário é o defeito clássico
 * do padrão: o músico acha que respondeu 30 e respondeu 27.
 */
export function useBatchRespondRequests(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestIds, action, rejectionReason }: BatchRespondVariables) =>
      batchRespondRequests(requestIds, action, rejectionReason),
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: musicianRequestsKey(musicianId, 'pending') });
    },
  });
}
