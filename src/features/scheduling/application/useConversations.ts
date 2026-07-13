import { useQuery } from '@tanstack/react-query';
import { listConversations } from '../infrastructure/conversation.api';

export const conversationsKey = (musicianId: string) => ['scheduling', musicianId, 'conversations'] as const;

export function useConversations(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? conversationsKey(musicianId) : ['scheduling', 'conversations', 'disabled'],
    queryFn:   listConversations,
    enabled:   !!musicianId,
    staleTime: 10 * 1_000,
  });
}
