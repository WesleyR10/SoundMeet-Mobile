import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearTouringLocation, setTouringLocation } from '../infrastructure/musician.api';
import { extractApiMessage } from '@/shared/services/http/types';
import { musicianProfileKey } from './useMusician';
import type { SetTouringLocationPayload } from '../domain/musician.types';

/**
 * Modo turnê (7.13d) — localização temporária somada à base permanente.
 *
 * As duas mutations invalidam o perfil: o DELETE porque responde 204 sem corpo
 * (não há o que aproveitar da resposta), e o PATCH porque `is_touring` e
 * `touring_expires_at` são derivados no backend — reconstruí-los no cliente
 * seria manter uma segunda verdade sobre quando a turnê acaba.
 */
export function useSetTouringLocation(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetTouringLocationPayload) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return setTouringLocation(musicianId, payload);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    },
  });
}

export function useClearTouringLocation(musicianId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return clearTouringLocation(musicianId);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: musicianProfileKey(musicianId) });
    },
  });
}

export function getTouringErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
