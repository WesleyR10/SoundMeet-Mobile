import { useQuery } from '@tanstack/react-query';
import { listMyInvites } from '../infrastructure/repertoire.api';

export const repertoireInvitesKey = (musicianId: string) => ['musician', musicianId, 'repertoire-invites'] as const;

// Repertórios de OUTROS músicos onde o músico logado foi convidado
// nominalmente (feature PRO — ver repertoire_nominal_invite no backend).
export function useRepertoireInvites(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? repertoireInvitesKey(musicianId) : ['musician', 'repertoire-invites', 'disabled'],
    queryFn:   () => listMyInvites(musicianId!),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}
