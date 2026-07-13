import { useQuery } from '@tanstack/react-query';
import { getMusician } from '../infrastructure/musician.api';

export const musicianProfileKey = (musicianId: string) => ['musician', musicianId, 'profile'] as const;

// Hook de leitura para ViewProfileScreen/EditProfileScreen (Bloco 2). Distinto
// da query interna de useMusicianWizardGate.ts (key 'wizard-gate') — mesmo
// endpoint, propósitos e ciclos de invalidação diferentes.
export function useMusician(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? musicianProfileKey(musicianId) : ['musician', 'profile', 'disabled'],
    queryFn:   () => getMusician(musicianId!),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
