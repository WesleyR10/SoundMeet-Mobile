import { useQuery } from '@tanstack/react-query';
import { getContractPayout } from '../infrastructure/payout.api';

export const contractPayoutKey = (bookingId: string) =>
  ['contract', 'payout', bookingId] as const;

/**
 * Quanto a plataforma retém do cachê deste show.
 *
 * `staleTime` longo: os valores são **congelados** na criação da custódia e não
 * mudam mais — reajuste de tabela não alcança show contratado. O que muda é o
 * status da custódia, e isso esta tela não mostra.
 */
export function useContractPayout(
  musicianId: string | null,
  bookingId: string | null,
) {
  return useQuery({
    queryKey:
      bookingId ? contractPayoutKey(bookingId) : ['contract', 'payout', 'disabled'],
    queryFn:   () => getContractPayout(musicianId!, bookingId!),
    enabled:   !!musicianId && !!bookingId,
    staleTime: 10 * 60 * 1_000,
  });
}
