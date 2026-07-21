import { useQuery } from '@tanstack/react-query';
import { listMusicians } from '../infrastructure/musician-public.api';
import type { MusicianListParams } from '../domain/musician-public.types';

export const musiciansSearchKey = (params: MusicianListParams) => ['musicians-search', params] as const;

// Busca de músicos do fã (FanExplore, aba "Músicos" — 7.13c). `enabled`
// segura a query quando a aba de estabelecimentos está ativa, evitando
// fetch duplo a cada troca de filtro.
export function useMusiciansSearch(params: MusicianListParams = {}, enabled = true) {
  return useQuery({
    queryKey:  musiciansSearchKey(params),
    queryFn:   () => listMusicians(params),
    staleTime: 30 * 1_000,
    enabled,
  });
}
