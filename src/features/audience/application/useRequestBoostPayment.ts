import { useQuery } from '@tanstack/react-query';
import { getRequestBoostPayment } from '../infrastructure/request.api';

export const requestBoostPaymentKey = (requestId: string) =>
  ['requests', requestId, 'boost', 'payment'] as const;

/**
 * A cobrança do destaque, relida do servidor.
 *
 * `refetchInterval` enquanto está `awaiting_payment`: o PIX é assíncrono e o
 * público **não tem push registrado** (`Audience` não tem `push_token`), então
 * o socket é o único aviso em tempo real — e ele só funciona com o app aberto.
 * O polling é a rede de segurança para quem voltou do app do banco e ficou
 * olhando a tela esperando confirmar.
 */
export function useRequestBoostPayment(requestId: string | null, enabled = true) {
  return useQuery({
    queryKey: requestId
      ? requestBoostPaymentKey(requestId)
      : ['requests', 'boost', 'payment', 'disabled'],
    queryFn: () => getRequestBoostPayment(requestId!),
    enabled: !!requestId && enabled,
    refetchInterval: (query) =>
      query.state.data?.status === 'awaiting_payment' ? 5_000 : false,
  });
}
