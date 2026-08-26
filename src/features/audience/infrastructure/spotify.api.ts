import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  SpotifyLinkStatus,
  SpotifySaveResult,
  SpotifyTrackSearchResult,
} from '../domain/spotify.types';

/** GET /audiences/:id/spotify — existe vínculo? */
export async function getSpotifyStatus(
  audienceId: string,
): Promise<SpotifyLinkStatus> {
  const { data } = await httpClient.get<ApiEnvelope<SpotifyLinkStatus>>(
    `/audiences/${audienceId}/spotify`,
  );
  return data.data;
}

/**
 * POST /audiences/:id/spotify/connect
 *
 * Devolve a URL de consentimento; quem a abre é a tela, num navegador. O
 * `state` assinado dentro dela é o que amarra a autorização a ESTE fã — o
 * callback volta pelo navegador, sem token.
 */
export async function connectSpotify(audienceId: string): Promise<string> {
  const { data } = await httpClient.post<
    ApiEnvelope<{ authorization_url: string }>
  >(`/audiences/${audienceId}/spotify/connect`, {});
  return data.data.authorization_url;
}

export async function disconnectSpotify(audienceId: string): Promise<void> {
  await httpClient.delete(`/audiences/${audienceId}/spotify`);
}

/**
 * POST /audiences/:id/spotify/tracks/search
 *
 * ⚠️ **Procura, não salva.** Devolve UM candidato para o fã confirmar: casar
 * título+artista com o catálogo é ambíguo (cover, remaster, homônimo), e salvar
 * direto poria silenciosamente a faixa errada na biblioteca de alguém.
 */
export async function findSpotifyTrack(
  audienceId: string,
  payload: { title: string; artist: string },
): Promise<SpotifyTrackSearchResult> {
  const { data } = await httpClient.post<ApiEnvelope<SpotifyTrackSearchResult>>(
    `/audiences/${audienceId}/spotify/tracks/search`,
    payload,
  );
  return data.data;
}

/** POST /audiences/:id/spotify/tracks — salva a faixa CONFIRMADA. */
export async function saveSpotifyTrack(
  audienceId: string,
  trackId: string,
): Promise<SpotifySaveResult> {
  const { data } = await httpClient.post<ApiEnvelope<SpotifySaveResult>>(
    `/audiences/${audienceId}/spotify/tracks`,
    { track_id: trackId },
  );
  return data.data;
}
