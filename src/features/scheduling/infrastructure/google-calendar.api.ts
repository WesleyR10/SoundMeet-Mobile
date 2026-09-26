import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { GoogleCalendarStatus } from '../domain/google-calendar.types';

// Rotas do google-calendar-module (backend 7.18). As três são autenticadas e
// passam pelo MusicianOwnershipGuard — o callback do OAuth é outra rota, fixa e
// pública, e o app nunca a chama: quem a chama é o navegador do Google.

export async function getGoogleCalendarStatus(
  musicianId: string,
): Promise<GoogleCalendarStatus> {
  const { data } = await httpClient.get<ApiEnvelope<GoogleCalendarStatus>>(
    `/musicians/${musicianId}/google-calendar/status`,
  );
  return data.data;
}

/**
 * Devolve a URL de consentimento do Google; quem abre é a tela, num navegador.
 *
 * O `state` assinado dentro dela é o que amarra a autorização a ESTE músico —
 * o callback volta pelo navegador, sem token. Mesmo desenho do vínculo do
 * Mercado Pago (`wallet.api.ts`).
 */
export async function getGoogleCalendarConsentUrl(
  musicianId: string,
): Promise<string> {
  const { data } = await httpClient.get<ApiEnvelope<{ consent_url: string }>>(
    `/musicians/${musicianId}/google-calendar/connect`,
  );
  return data.data.consent_url;
}

/**
 * Desconecta. O backend revoga no Google em best-effort e **sempre** zera os
 * tokens locais — Google fora do ar não segura a desconexão.
 *
 * ⚠️ Eventos já criados na agenda do músico NÃO são apagados: eles são dele, e
 * varrer a agenda de alguém ao desligar uma integração seria destrutivo muito
 * além do que ele pediu. O que para é a sincronização daí em diante.
 */
export async function disconnectGoogleCalendar(musicianId: string): Promise<void> {
  await httpClient.delete(`/musicians/${musicianId}/google-calendar`);
}
