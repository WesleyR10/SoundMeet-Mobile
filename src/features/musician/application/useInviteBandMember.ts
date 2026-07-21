import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteBandMember } from '../infrastructure/band.api';
import { bandKey, myBandsKey } from './useBands';
import { extractApiMessage } from '@/shared/services/http/types';
import type { CreateBandMemberInvitePayload } from '../domain/band.types';

// Mesma chamada serve pra "convidar" e "convidar de novo" um musician_id que
// já tinha um convite "declined" nessa banda (o backend reativa sozinho —
// ver band.api.ts inviteBandMember).
export function useInviteBandMember(bandId: string, musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBandMemberInvitePayload) => inviteBandMember(bandId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bandKey(bandId) });
      if (musicianId) queryClient.invalidateQueries({ queryKey: myBandsKey(musicianId) });
    },
  });
}

export function getInviteBandMemberErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
