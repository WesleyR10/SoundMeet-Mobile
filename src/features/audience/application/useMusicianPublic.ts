import { useQuery } from '@tanstack/react-query';
import { getMusicianPublic } from '../infrastructure/musician-public.api';

export const musicianPublicKey = (id: string) => ['musicians', id, 'public'] as const;

export function useMusicianPublic(id: string | null) {
  return useQuery({
    queryKey:  id ? musicianPublicKey(id) : ['musicians', 'public', 'disabled'],
    queryFn:   () => getMusicianPublic(id!),
    enabled:   !!id,
    staleTime: 60 * 1_000,
  });
}
