import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { extractApiMessage } from '@/shared/services/http/types';
import {
  connectSpotify,
  disconnectSpotify,
  findSpotifyTrack,
  getSpotifyStatus,
  saveSpotifyTrack,
} from '../infrastructure/spotify.api';

export const spotifyStatusKey = (audienceId: string) =>
  ['audience', audienceId, 'spotify'] as const;

/** Deep link de volta — precisa bater com `SPOTIFY_APP_RETURN_URL` no backend. */
const RETURN_URL = 'soundmeet://perfil/spotify';

export function useSpotifyStatus(audienceId: string | null) {
  return useQuery({
    queryKey: audienceId
      ? spotifyStatusKey(audienceId)
      : ['audience', 'spotify', 'disabled'],
    queryFn:   () => getSpotifyStatus(audienceId!),
    enabled:   !!audienceId,
    staleTime: 60 * 1_000,
  });
}

/**
 * Abre o consentimento do Spotify no navegador.
 *
 * `openAuthSessionAsync` (Chrome Custom Tab / SFSafariViewController), e não
 * `Linking.openURL`: mantém o fã dentro do app e fecha sozinho no redirect.
 * Mesmo padrão de `useConnectMercadoPago`.
 *
 * Invalida o status em `onSettled` — não em `onSuccess` — porque quem conclui
 * o vínculo é o backend, no callback; o app só sabe que a janela fechou, e
 * precisa reconsultar tanto no caminho feliz quanto no cancelado.
 */
export function useConnectSpotify(audienceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const url = await connectSpotify(audienceId!);
      return WebBrowser.openAuthSessionAsync(url, RETURN_URL);
    },
    onSettled: () => {
      if (audienceId) {
        void queryClient.invalidateQueries({
          queryKey: spotifyStatusKey(audienceId),
        });
      }
    },
  });
}

export function useDisconnectSpotify(audienceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectSpotify(audienceId!),
    onSettled: () => {
      if (audienceId) {
        void queryClient.invalidateQueries({
          queryKey: spotifyStatusKey(audienceId),
        });
      }
    },
  });
}

/**
 * Procurar e salvar — duas mutations, porque são dois atos.
 *
 * A busca devolve um candidato; salvar só acontece depois do toque de
 * confirmação. Fundir as duas recriaria a adivinhação no ponto em que ela vira
 * escrita na conta de outra pessoa.
 */
export function useSpotifyTrackSave(audienceId: string | null) {
  const search = useMutation({
    mutationFn: (payload: { title: string; artist: string }) =>
      findSpotifyTrack(audienceId!, payload),
  });

  const save = useMutation({
    mutationFn: (trackId: string) => saveSpotifyTrack(audienceId!, trackId),
  });

  return { search, save };
}

/**
 * Mensagem de erro da ponte, em português e acionável.
 *
 * O 503 é o caso que a mensagem crua não explica: significa que a integração
 * não está configurada no servidor, não que o fã fez algo errado.
 */
export function getSpotifyErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (status === 503) {
    return 'A integração com o Spotify está indisponível no momento.';
  }

  return extractApiMessage(error);
}
