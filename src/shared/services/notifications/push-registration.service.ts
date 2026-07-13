import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Função assíncrona pura (mesmo estilo de qrShare.ts) — sem hook, sem estado.
// Nunca lança: qualquer falha (permissão negada, simulador, credenciais EAS
// ainda não configuradas) retorna null e o chamador decide o que fazer
// (aqui, best-effort silencioso — ver usePushRegistration.ts).
export async function registerForPushNotifications(): Promise<string | null> {
  // Guard oficial recomendado pelo guia de push do Expo — evita confundir
  // "simulador sem push" com falha real.
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch {
    // Ex.: credenciais EAS de push ainda não configuradas — código fica
    // pronto pra quando forem, sem quebrar o app enquanto isso.
    return null;
  }
}
