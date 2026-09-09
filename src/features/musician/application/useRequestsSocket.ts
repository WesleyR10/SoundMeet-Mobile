import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, getSocket } from '@/shared/services/websocket/socket.client';
import { musicianRequestsKey } from './useRequests';

// Escopo de sessão — montado uma única vez em MusicianTabNavigator (não
// também em LiveDashboardScreen), pra não disputar connect/disconnect no
// socket singleton entre dois pontos de montagem. LiveDashboardScreen só lê
// do cache do TanStack Query que este hook mantém fresco.
export function useRequestsSocket(musicianId: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!musicianId) return;

    const socket = getSocket();
    connectSocket();

    const onNewRequest = () => {
      queryClient.invalidateQueries({ queryKey: musicianRequestsKey(musicianId, 'pending') });
    };

    // O destaque saiu de "a confirmar" para "confirmado": o card na fila
    // precisa refletir isso ao vivo, senão o músico decide olhando um selo
    // desatualizado no meio do show.
    const onBoostConfirmed = () => {
      queryClient.invalidateQueries({ queryKey: musicianRequestsKey(musicianId, 'pending') });
      queryClient.invalidateQueries({ queryKey: musicianRequestsKey(musicianId, 'accepted') });
    };

    socket.on('request.new', onNewRequest);
    socket.on('request.boost.confirmed', onBoostConfirmed);

    return () => {
      socket.off('request.new', onNewRequest);
      socket.off('request.boost.confirmed', onBoostConfirmed);
      disconnectSocket();
    };
  }, [musicianId, queryClient]);
}
