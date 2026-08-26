import { useQuery } from '@tanstack/react-query';
import { listEscrows } from '../infrastructure/wallet.api';
import type { EscrowStatus } from '../domain/escrow.types';

export const escrowsKey = (musicianId: string, status?: EscrowStatus) =>
  ['payment', 'escrows', musicianId, status ?? 'all'] as const;

/**
 * Custódias de cachê do músico.
 *
 * `staleTime` de 30s, igual ao de gorjetas: o estado muda por eventos que
 * acontecem FORA do app (a casa paga, o job libera), então um cache longo
 * mostraria "aguardando pagamento" depois de o dinheiro já ter entrado.
 *
 * Sem paginação por enquanto — um músico tem poucos shows em custódia
 * simultâneos, e nenhuma lista do app usa `useInfiniteQuery` hoje.
 */
export function useEscrows(musicianId: string | null, status?: EscrowStatus) {
  return useQuery({
    queryKey:  musicianId ? escrowsKey(musicianId, status) : ['payment', 'escrows', 'disabled'],
    queryFn:   () => listEscrows(musicianId!, { per_page: 30, status }),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
