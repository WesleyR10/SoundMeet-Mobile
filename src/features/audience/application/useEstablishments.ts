import { useQuery } from '@tanstack/react-query';
import { listEstablishments } from '../infrastructure/establishment.api';
import type { EstablishmentListParams } from '../domain/establishment.types';

export const establishmentsListKey = (params: EstablishmentListParams) => ['establishments', params] as const;

// Feed de descoberta (Home) e Explorar/Busca reaproveitam o mesmo hook — só
// os `params` (filtro) mudam. Sem geo/raio ainda (ver roadmap.md 7.13).
export function useEstablishments(params: EstablishmentListParams = {}) {
  return useQuery({
    queryKey:  establishmentsListKey(params),
    queryFn:   () => listEstablishments(params),
    staleTime: 30 * 1_000,
  });
}
