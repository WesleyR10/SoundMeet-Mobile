import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/shared/services/websocket/socket.client';
import { walletKey } from './useWallet';
import { tipsKey } from './useTips';

type WalletSocketState = {
  trigger: boolean;
};

// Screen-scoped (montado só em WalletScreen, ao contrário de useRequestsSocket
// que vive em MusicianTabNavigator) — por isso NUNCA chama connectSocket()/
// disconnectSocket() aqui: o socket é um singleton não reference-counted
// (ver socket.client.ts) já conectado/desconectado por useRequestsSocket no
// escopo da sessão. Chamar disconnect no unmount desta tela derrubaria a
// conexão compartilhada e quebraria "Novo pedido" ao vivo no resto do app.
// Só assina/desassina o evento 'tip.received' — connect/disconnect ficam de
// fora de propósito.
export function useWalletSocket(musicianId: string | null): WalletSocketState {
  const queryClient = useQueryClient();
  const [trigger, setTrigger] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!musicianId) return;

    const socket = getSocket();

    const onTipReceived = () => {
      queryClient.invalidateQueries({ queryKey: walletKey(musicianId) });
      queryClient.invalidateQueries({ queryKey: tipsKey(musicianId) });

      // Flip true→false→true pra permitir re-disparar o burst em gorjetas
      // seguintes (ConfettiBurst só reage à transição false→true do prop).
      setTrigger(false);
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
      resetTimeout.current = setTimeout(() => setTrigger(true), 16);
    };

    socket.on('tip.received', onTipReceived);

    return () => {
      socket.off('tip.received', onTipReceived);
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
    };
  }, [musicianId, queryClient]);

  return { trigger };
}
