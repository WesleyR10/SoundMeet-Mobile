import { useEffect } from 'react';
import { Linking } from 'react-native';
import { navigationRef } from '@/navigation/navigationRef';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { parseQrTarget } from '@/shared/utils/qr-link';
import { useDeepLinkStore } from './deep-link.store';

// soundmeet://repertoire/shared/<token>, sem querystring.
const SHARED_REPERTOIRE_REGEX = /^soundmeet:\/\/repertoire\/shared\/([^/?#]+)$/;

function extractSharedRepertoireToken(url: string | null): string | null {
  if (!url) return null;
  const match = SHARED_REPERTOIRE_REGEX.exec(url);
  return match ? match[1] : null;
}

// Não existia NENHUMA infraestrutura de deep link real neste app antes
// disso (confirmado: NavigationContainer sem `linking`, único outro
// "esquema" — soundmeet://musician/:id do QR code — é lido manualmente da
// câmera, nunca de uma URL real do sistema). Construído do zero espelhando
// o padrão já validado de navegação a partir de fora da árvore de telas
// (useNotificationResponseListener.ts, Bloco 5.6): navigationRef pra
// navegar de fora de um componente, cold-start via onReady do
// NavigationContainer, warm/background via listener.
function handleUrl(url: string | null): void {
  if (!url) return;

  /*
   * App Link do QR code (`https://soundmeet.com.br/musico/<uuid>`).
   *
   * A partir dos App Links/Universal Links, o MESMO código impresso na mesa
   * chega aqui como URL do sistema quando o app está instalado — e abre a
   * página web quando não está. Antes disso o QR gravava `soundmeet://`, que
   * simplesmente não fazia nada na câmera nativa de quem não tinha o app.
   *
   * `parseQrTarget` valida o host: o SO só entrega URLs do domínio verificado,
   * mas o mesmo parser serve à câmera, onde qualquer texto pode chegar.
   */
  const qrTarget = parseQrTarget(url);
  if (qrTarget?.kind === 'musician') {
    // Sempre pelo relay: o perfil público mora no stack do fã, que só existe
    // montado depois que a sessão resolve. RootNavigator consome.
    useDeepLinkStore.getState().setPendingMusicianId(qrTarget.id);
    return;
  }

  const token = extractSharedRepertoireToken(url);
  if (!token) return;

  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (isAuthenticated && navigationRef.isReady()) {
    navigationRef.navigate('SharedRepertoire', { token });
    return;
  }

  // Ainda não logado (ou RootNavigator ainda não montou) — guarda o token;
  // RootNavigator observa isAuthenticated e consome isso assim que resolver
  // (ver useEffect em RootNavigator.tsx).
  useDeepLinkStore.getState().setPendingSharedRepertoireToken(token);
}

// Cold start — chamado a partir do onReady do NavigationContainer
// (RootNavigator.tsx), mesmo motivo de checkInitialNotificationResponse:
// onReady só dispara depois que o container termina de montar, garantindo
// navigationRef.isReady() === true e restoreSession() já em andamento.
export function checkInitialDeepLink(): void {
  Linking.getInitialURL().then(handleUrl);
}

// Warm/background — app já rodando quando o link é tocado.
export function useDeepLinkListener(): void {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);
}
