import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendEvent } from '../infrastructure/audience.api';
import { audienceProfileKey } from './useAudience';

// Pré-requisito pra SongRequestScreen: CanMakeRequestPolicy exige
// is_audience_attendee antes de aceitar um pedido musical.
export function useAttendEvent(audienceId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, establishmentId }: { eventId: string; establishmentId: string }) =>
      attendEvent(audienceId!, eventId, establishmentId),
    onSuccess: () => {
      if (audienceId) queryClient.invalidateQueries({ queryKey: audienceProfileKey(audienceId) });
    },
  });
}
