import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { navigationRef } from '@/navigation/navigationRef';

type NotificationData = { type?: string; conversation_id?: string };

function handleResponse(response: Notifications.NotificationResponse | null): void {
  const data = response?.notification.request.content.data as NotificationData | undefined;
  if (!data || !navigationRef.isReady()) return;

  if (data.type === 'tip.received') {
    navigationRef.navigate('MusicianTabs', { screen: 'Wallet' });
  }

  // Chat (Bloco 9) — funciona direto via navigationRef, sem getParent(),
  // porque Chat é registrado como irmã de nível raiz (não filha de
  // MusicianTabs), mesmo padrão de SharedRepertoire/SharedSongViewer.
  if (data.type === 'chat.message.new' && typeof data.conversation_id === 'string') {
    navigationRef.navigate('Chat', { conversationId: data.conversation_id });
  }

  // Proposta de show nova ou ajustada (18/set/2026). O push traz o
  // `booking_id`, não a conversa — e não há rota de backend que resolva uma
  // pela outra. A lista de conversas é o destino certo: a conversa da casa
  // sobe para o topo com a mensagem que registrou a proposta, e o cartão de
  // aceitar/recusar está dentro dela.
  if (data.type === 'booking.proposed' || data.type === 'booking.revised') {
    navigationRef.navigate('ConversationList');
  }
}

// Cold start (app fechado, usuário toca na notificação e o app abre do zero)
// — chamada a partir do `onReady` do NavigationContainer (RootNavigator.tsx),
// não de um useEffect de mount. `onReady` só dispara depois que o container
// termina de montar, então `navigationRef.isReady()` já é garantidamente
// `true` aqui — evita a race condition de rodar `getLastNotificationResponseAsync()`
// num useEffect de RootNavigator que dispara antes de `restoreSession()`
// resolver (SecureStore + possível refresh de token via rede, plausivelmente
// mais lento que a chamada nativa), o que fazia `handleResponse` descartar a
// navegação silenciosamente sem retry.
export function checkInitialNotificationResponse(): void {
  Notifications.getLastNotificationResponseAsync().then(handleResponse);
}

// Cross-cutting (shared/, não features/) — cobre warm/background (app já
// rodando quando a notificação chega ou é tocada; navigationRef já está
// pronto nesse caso, sem risco de race).
export function useNotificationResponseListener(): void {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);
}
