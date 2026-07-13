import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAsRead } from '../infrastructure/conversation.api';
import { conversationsKey } from './useConversations';

// Disparada no mount do ChatScreen e a cada message.new recebido enquanto a
// tela está aberta (ver useChatSocket.ts). Sem otimismo local — status de
// leitura é secundário o bastante pra esperar o round-trip real, e
// invalidar conversationsKey já resolve o badge/unread_count da lista.
export function useMarkAsRead(conversationId: string | null, musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!conversationId) throw new Error('conversationId ausente');
      return markAsRead(conversationId);
    },
    onSuccess: () => {
      if (musicianId) queryClient.invalidateQueries({ queryKey: conversationsKey(musicianId) });
    },
  });
}
