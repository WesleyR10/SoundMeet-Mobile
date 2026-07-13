import { useQuery } from '@tanstack/react-query';
import { listTips } from '../infrastructure/wallet.api';
import type { TipStatus } from '../domain/tip.types';

export const tipsKey = (musicianId: string, status?: TipStatus) =>
  ['payment', 'tips', musicianId, status ?? 'all'] as const;

// Mesmo padrão de useEstablishments (per_page fixo, sem infinite scroll —
// nenhuma lista do app usa useInfiniteQuery hoje); histórico de gorjetas
// recentes cabe numa página só pra maioria dos músicos no MVP.
export function useTips(musicianId: string | null, status?: TipStatus) {
  return useQuery({
    queryKey:  musicianId ? tipsKey(musicianId, status) : ['payment', 'tips', 'disabled'],
    queryFn:   () => listTips(musicianId!, { per_page: 30, status }),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
