import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/shared/services/websocket/socket.client';
import { conversationsKey } from './useConversations';

// Escopo de sessão — piggyback no socket singleton de /notifications já
// aberto/fechado por useRequestsSocket (MusicianTabNavigator). Não chama
// connect/disconnect próprio, mesmo padrão de useWalletSocket.ts: um
// segundo caller desconectando derrubaria pedidos ao vivo no resto do app.
// O evento chat.message.new é emitido pelo NotificationsChatEventsHandler
// (backend) na mesma room user:${musicianId} já usada por
// request.new/tip.received — é essa reutilização que dá atualização de
// lista/badge sem precisar manter uma segunda conexão persistente pro
// namespace /chat (que fica screen-scoped, ver useChatSocket.ts).
export function useChatNotificationsSocket(musicianId: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!musicianId) return;

    const socket = getSocket();

    const onChatMessageNew = () => {
      queryClient.invalidateQueries({ queryKey: conversationsKey(musicianId) });
    };

    socket.on('chat.message.new', onChatMessageNew);

    return () => {
      socket.off('chat.message.new', onChatMessageNew);
    };
  }, [musicianId, queryClient]);
}
