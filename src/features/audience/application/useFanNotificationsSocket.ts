import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, getSocket } from '@/shared/services/websocket/socket.client';
import type {
  RequestBoostPaidEvent,
  RequestBoostPaymentReadyEvent,
  TipConfirmedEvent,
} from '../domain/boost-notifications.types';
import { useFanCelebrationStore } from './fan-celebration.store';
import { usePendingBoostStore } from './pending-boost.store';

/**
 * O socket do FÃ.
 *
 * ## Por que isto não existia
 *
 * `connectSocket()` só era chamado em `MusicianTabNavigator`: o backend já
 * emitia `request.status_changed` para a room do público desde sempre, e
 * ninguém escutava. Na prática o fã nunca soube de nada em tempo real — nem
 * que o pedido dele foi aceito.
 *
 * ## Escopo de sessão, montado UMA vez
 *
 * Montado só em `FanTabNavigator`, espelhando `useRequestsSocket`. O socket é
 * singleton **não** reference-counted: um segundo par connect/disconnect (numa
 * conta multi-role, por exemplo) derrubaria a conexão do outro lado. Hooks que
 * só escutam — como `useWalletSocket` — fazem piggyback sem conectar.
 */
export function useFanNotificationsSocket(audienceId: string | null): void {
  const queryClient = useQueryClient();
  const setPendingBoost = usePendingBoostStore((s) => s.setPending);
  const clearPendingBoost = usePendingBoostStore((s) => s.clear);
  const celebrate = useFanCelebrationStore((s) => s.celebrate);

  useEffect(() => {
    if (!audienceId) return;

    const socket = getSocket();
    connectSocket();

    const onPaymentReady = (payload: RequestBoostPaymentReadyEvent) => {
      setPendingBoost({
        request_id:      payload.request_id,
        tip_id:          payload.tip_id,
        song_title:      payload.song_title,
        amount:          payload.amount,
        qr_code:         payload.qr_code,
        copy_paste_code: payload.copy_paste_code,
        expires_at:      payload.expires_at,
      });
    };

    const onBoostPaid = (payload: RequestBoostPaidEvent) => {
      clearPendingBoost(payload.request_id);
      celebrate({
        tip_id:      payload.tip_id,
        amount:      payload.amount,
        song_title:  payload.song_title,
        dedication:  payload.dedication,
        musician_id: payload.musician_id,
      });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    };

    // Gorjeta avulsa. Num pedido com destaque os dois eventos chegam; o store
    // deduplica por `tip_id` e o primeiro vence.
    const onTipConfirmed = (payload: TipConfirmedEvent) => {
      celebrate({
        tip_id:      payload.tip_id,
        amount:      payload.amount,
        song_title:  null,
        dedication:  payload.message,
        musician_id: payload.musician_id,
      });
    };

    socket.on('request.boost.payment_ready', onPaymentReady);
    socket.on('request.boost.paid', onBoostPaid);
    socket.on('tip.confirmed', onTipConfirmed);

    return () => {
      socket.off('request.boost.payment_ready', onPaymentReady);
      socket.off('request.boost.paid', onBoostPaid);
      socket.off('tip.confirmed', onTipConfirmed);
      disconnectSocket();
    };
  }, [audienceId, queryClient, setPendingBoost, clearPendingBoost, celebrate]);
}
