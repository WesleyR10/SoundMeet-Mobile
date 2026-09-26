import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConsentUrl,
  getGoogleCalendarStatus,
} from '../infrastructure/google-calendar.api';
import {
  parseGoogleCalendarReturn,
  type GoogleCalendarConnectOutcome,
} from '../domain/google-calendar.rules';
import { GOOGLE_CALENDAR_RETURN_URL } from '../domain/google-calendar.types';

export const googleCalendarKey = (musicianId: string) =>
  ['scheduling', musicianId, 'google-calendar'] as const;

export function useGoogleCalendarStatus(musicianId: string | null) {
  return useQuery({
    queryKey:  musicianId ? googleCalendarKey(musicianId) : ['scheduling', 'google-calendar', 'disabled'],
    queryFn:   () => getGoogleCalendarStatus(musicianId!),
    enabled:   !!musicianId,
    staleTime: 30 * 1_000,
  });
}

/**
 * Conectar a conta Google para que os shows confirmados entrem na agenda dele.
 *
 * Abre o consentimento em **Chrome Custom Tab** (`openAuthSessionAsync`), o
 * mesmo padrão do vínculo do Mercado Pago: o fluxo volta sozinho para o app
 * pelo deep link do callback, sem o músico precisar trocar de aplicativo na
 * mão.
 *
 * ⚠️ **Invalida o status em `onSettled`, não em `onSuccess`.** O resultado que
 * o app lê é uma pista, não a verdade — quem sabe se a integração foi gravada
 * é o servidor. Se a aba fechar sem redirect (`unknown`), releremos assim
 * mesmo, e é isso que impede a tela de continuar oferecendo "Conectar" para
 * quem acabou de conectar.
 */
export function useConnectGoogleCalendar(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<GoogleCalendarConnectOutcome>({
    mutationFn: async () => {
      const consentUrl = await getGoogleCalendarConsentUrl(musicianId!);
      const result = await WebBrowser.openAuthSessionAsync(
        consentUrl,
        GOOGLE_CALENDAR_RETURN_URL,
      );
      return result.type === 'success'
        ? parseGoogleCalendarReturn(result.url)
        : 'unknown';
    },
    onSettled: () => {
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: googleCalendarKey(musicianId) });
      }
    },
  });
}

export function useDisconnectGoogleCalendar(musicianId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectGoogleCalendar(musicianId!),
    onSuccess: () => {
      if (musicianId) {
        void queryClient.invalidateQueries({ queryKey: googleCalendarKey(musicianId) });
      }
    },
  });
}
