import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSocket, disconnectChatSocket } from '@/shared/services/websocket/socket.client';
import { chatMessagesKey } from './useChat';
import type { ChatMessage, ConversationMessagesPage } from '../domain/conversation.types';

type MessagesReadPayload = { conversation_id: string; reader_id: string };

// Escopo de tela — ChatScreen é o único consumidor do namespace /chat hoje
// (ver comentário em socket.client.ts). useEffect simples (não
// useFocusEffect): ChatScreen é uma tela de stack (push/pop), então
// mount/unmount já rastreia "essa conversa está aberta agora".
//
// `userId` e `onMessageFromOther` existem por causa de uma corrida real
// (achada em revisão pós-implementação, confirmada por 3 ângulos
// independentes): POST /conversations/:id/messages emite o socket
// message.new de volta pra própria room do remetente ANTES de retornar a
// resposta HTTP (chat.controller.ts, sendMessage()) — então o eco da
// própria mensagem pode chegar por aqui antes de useSendMessage.onSuccess
// reconciliar o id temporário. Sem esse guard, o filter-por-id abaixo não
// reconhece o eco (id real ≠ tempId) e insere um segundo bubble; quando
// onSuccess roda em seguida, ele SUBSTITUI o temporário pelo mesmo item já
// inserido pelo socket, deixando duas entradas com o mesmo message_id.
// Solução: onSuccess é o único reconciliador da própria mensagem; aqui só
// tratamos mensagens de QUEM NÃO SOMOS NÓS.
export function useChatSocket(
  conversationId: string | null,
  userId: string | null,
  onMessageFromOther?: () => void,
): void {
  const queryClient = useQueryClient();

  // `onMessageFromOther` é tipicamente uma arrow function inline no call
  // site (ex.: `() => markAsRead.mutate()`) — nova referência a cada render
  // de ChatScreen. Guardar num ref (em vez de listar como dependência do
  // effect abaixo) evita desconectar/reconectar o socket a cada render só
  // porque o callback mudou de identidade.
  const onMessageFromOtherRef = useRef(onMessageFromOther);
  onMessageFromOtherRef.current = onMessageFromOther;

  useEffect(() => {
    if (!conversationId) return;

    const socket = getChatSocket();
    socket.connect();
    socket.emit('join_conversation', { conversation_id: conversationId });

    const key = chatMessagesKey(conversationId);

    const onMessageNew = (message: ChatMessage) => {
      const isOwnEcho = message.sender_id === userId;
      if (isOwnEcho) return;

      queryClient.setQueryData<ConversationMessagesPage>(key, (current) => {
        if (!current) return current;
        const withoutDuplicate = current.messages.filter((m) => m.message_id !== message.message_id);
        return { ...current, messages: [...withoutDuplicate, message] };
      });
      onMessageFromOtherRef.current?.();
    };

    const onMessagesRead = ({ reader_id }: MessagesReadPayload) => {
      queryClient.setQueryData<ConversationMessagesPage>(key, (current) => {
        if (!current) return current;
        return {
          ...current,
          messages: current.messages.map((m) =>
            m.sender_id !== reader_id && m.status !== 'read'
              ? { ...m, status: 'read' as const, read_at: new Date().toISOString() }
              : m,
          ),
        };
      });
    };

    socket.on('message.new', onMessageNew);
    socket.on('messages.read', onMessagesRead);

    return () => {
      socket.off('message.new', onMessageNew);
      socket.off('messages.read', onMessagesRead);
      socket.emit('leave_conversation', { conversation_id: conversationId });
      disconnectChatSocket();
    };
  }, [conversationId, userId, queryClient]);
}
