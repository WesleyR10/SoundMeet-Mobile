import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { extractApiMessage } from '@/shared/services/http/types';
import {
  acceptInquiry,
  getInquiryEstablishment,
  listInquiries,
  rejectInquiry,
} from '../infrastructure/inquiry.api';
import type { InquiryStatus } from '../domain/inquiry.types';

export const inquiriesKey = (musicianId: string, status?: InquiryStatus) =>
  ['scheduling', musicianId, 'inquiries', status ?? 'all'] as const;

export const inquiryEstablishmentKey = (establishmentId: string) =>
  ['scheduling', 'inquiry-establishment', establishmentId] as const;

/**
 * Propostas recebidas. O `musicianId` entra só na CHAVE, nunca na query — o
 * backend escopa pelo JWT. Serve para não misturar cache entre contas no
 * multi-role switching, que é o mesmo motivo de `conversationsKey`.
 */
export function useInquiries(musicianId: string | null, status?: InquiryStatus) {
  return useQuery({
    queryKey: musicianId
      ? inquiriesKey(musicianId, status)
      : ['scheduling', 'inquiries', 'disabled'],
    queryFn:   () => listInquiries({ status, per_page: 50 }),
    enabled:   !!musicianId,
    staleTime: 10 * 1_000,
  });
}

/**
 * A casa que enviou a proposta — buscada SÓ quando o detalhe abre.
 *
 * `InquiryPresenter` não traz nada do estabelecimento além do id, então a ficha
 * técnica depende desta segunda chamada. Fazê-la por linha da lista seria um
 * N+1 visível; a ficha só importa no momento da decisão, então ela é carregada
 * quando o sheet abre. `staleTime` alto porque estrutura de palco muda muito
 * pouco — e a chave é por estabelecimento, então abrir duas propostas da mesma
 * casa reaproveita o cache.
 */
export function useInquiryEstablishment(establishmentId: string | null) {
  return useQuery({
    queryKey: establishmentId
      ? inquiryEstablishmentKey(establishmentId)
      : ['scheduling', 'inquiry-establishment', 'disabled'],
    queryFn:   () => getInquiryEstablishment(establishmentId!),
    enabled:   !!establishmentId,
    staleTime: 5 * 60 * 1_000,
  });
}

/**
 * Aceitar / recusar.
 *
 * Invalidação (e não `setQueryData` com a resposta) porque uma decisão muda a
 * proposta de faixa: ela sai de "abertas" e entra em "todas". Reescrever a
 * entrada no cache deixaria a lista filtrada exibindo uma proposta já decidida
 * até o próximo refetch.
 */
export function useDecideInquiry(musicianId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    // Prefixo sem o status: derruba as duas listas (abertas e todas) de uma vez.
    if (musicianId) {
      void queryClient.invalidateQueries({
        queryKey: ['scheduling', musicianId, 'inquiries'],
      });
    }
  };

  const accept = useMutation({
    mutationFn: (inquiryId: string) => acceptInquiry(inquiryId),
    onSuccess:  invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ inquiryId, reason }: { inquiryId: string; reason?: string }) =>
      rejectInquiry(inquiryId, reason),
    onSuccess: invalidate,
  });

  return { accept, reject };
}

/**
 * Mensagem de erro de uma decisão, em português e acionável.
 *
 * Dois casos que o usuário PRECISA entender, e que a mensagem crua do servidor
 * não explica:
 *
 *  - **403 numa proposta de banda:** só o líder aceita ou recusa. O payload não
 *    diz quem pode agir, então o erro é a primeira vez que isso aparece.
 *  - **422 "Only open inquiries…":** alguém já decidiu (ou o prazo venceu) entre
 *    a lista ter carregado e o toque no botão.
 */
export function getDecideInquiryErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (status === 403) {
    return 'Só o líder da banda pode aceitar ou recusar esta proposta.';
  }

  const message = extractApiMessage(error);
  if (/only open inquiries/i.test(message)) {
    return 'Esta proposta não está mais aberta — ela pode ter expirado ou já ter sido respondida.';
  }

  return message;
}
