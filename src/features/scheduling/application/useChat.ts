import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage } from '../infrastructure/conversation.api';
import { conversationsKey } from './useConversations';
import type { ChatMessage, ConversationMessagesPage } from '../domain/conversation.types';

export const chatMessagesKey = (conversationId: string) => ['scheduling', 'conversation', conversationId, 'messages'] as const;

// Sem useInfiniteQuery de propósito: nenhuma lista do app usa isso hoje
// (mesma decisão de useTips.ts — "nenhuma lista do mobile usa useInfiniteQuery
// hoje", per_page simples). Aqui há um motivo a mais: o cursor de
// GET /conversations/:id/messages avança pra mensagens MAIS RECENTES (não
// mais antigas — findByConversationId ordena created_at ASC), o oposto do
// que "carregar mais ao rolar pra cima" precisaria. Pro volume esperado do
// MVP (chat_design-debate.md), uma página de até 100 (o máximo aceito pelo
// backend) cobre o caso real; paginação de verdade fica pra quando/se o
// volume justificar.
export function useChat(conversationId: string | null) {
  return useQuery({
    queryKey:  conversationId ? chatMessagesKey(conversationId) : ['scheduling', 'conversation', 'disabled'],
    queryFn:   () => getMessages(conversationId!, undefined, 100),
    enabled:   !!conversationId,
    staleTime: 5 * 1_000,
  });
}

// UI otimista (chat-design-debate.md, seção 9): mensagem aparece na hora com
// status 'sent' local, reconciliada com o id/campos reais do servidor
// quando a resposta chega; revertida em caso de erro. Mesmo padrão de
// onMutate/onError/onSettled de useReorderSongs.ts.
export function useSendMessage(conversationId: string | null, userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error('conversationId ausente');
      return sendMessage(conversationId, content);
    },
    onMutate: async (content: string) => {
      if (!conversationId || !userId) return undefined;
      const key = chatMessagesKey(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ConversationMessagesPage>(key);

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        message_id:      tempId,
        conversation_id: conversationId,
        sender_id:       userId,
        sender_type:     'musician',
        content,
        status:          'sent',
        created_at:      new Date().toISOString(),
        read_at:         null,
      };

      if (previous) {
        queryClient.setQueryData<ConversationMessagesPage>(key, {
          ...previous,
          messages: [...previous.messages, optimisticMessage],
        });
      }

      return { tempId };
    },
    onSuccess: (created, _content, context) => {
      if (!conversationId || !context?.tempId) return;
      const key = chatMessagesKey(conversationId);
      const current = queryClient.getQueryData<ConversationMessagesPage>(key);
      if (!current) return;
      queryClient.setQueryData<ConversationMessagesPage>(key, {
        ...current,
        messages: current.messages.map((m) => (m.message_id === context.tempId ? created : m)),
      });
    },
    onError: (_err, _content, context) => {
      // Remove só a mensagem otimista que falhou, do estado ATUAL do cache
      // — não restaura o snapshot `previous` inteiro. Restaurar o snapshot
      // descartaria qualquer mensagem que tenha chegado via socket
      // (useChatSocket.ts) enquanto o POST estava em voo (ex.: o
      // estabelecimento respondeu antes do envio falhar), fazendo-a
      // desaparecer da tela até o próximo refetch/staleTime.
      if (!conversationId || !context?.tempId) return;
      const key = chatMessagesKey(conversationId);
      queryClient.setQueryData<ConversationMessagesPage>(key, (current) => {
        if (!current) return current;
        return { ...current, messages: current.messages.filter((m) => m.message_id !== context.tempId) };
      });
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: conversationsKey(userId) });
    },
  });
}
