import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerForPushNotifications } from '@/shared/services/notifications/push-registration.service';
import { registerPushToken } from '../infrastructure/musician.api';

// Roda uma vez por sessão autenticada (escopo: MusicianTabNavigator, junto
// de useRequestsSocket). Best-effort e silencioso — falha de permissão ou de
// credenciais EAS ainda não configuradas não deve travar nem avisar o
// usuário, o pedido ao vivo continua funcionando via WebSocket em foreground.
export function usePushRegistration(musicianId: string | null): void {
  useEffect(() => {
    if (!musicianId) return;
    let cancelled = false;

    (async () => {
      const token = await registerForPushNotifications();
      if (token && !cancelled) {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        registerPushToken(musicianId, token, platform).catch(() => undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [musicianId]);
}
