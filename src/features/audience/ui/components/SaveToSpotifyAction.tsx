import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { CheckCircle2, ExternalLink, Music4 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import {
  getSpotifyErrorMessage,
  useSpotifyStatus,
  useSpotifyTrackSave,
} from '../../application/useSpotify';
import { SpotifyTrackConfirmCard } from './SpotifyTrackConfirmCard';
import type { SpotifyTrackCandidate } from '../../domain/spotify.types';

type Props = {
  audienceId: string | null;
  title:      string;
  artist:     string;
  /**
   * Link direto da faixa já casada no pipeline. Quando existe, é o caminho
   * preferencial — a versão certa já foi decidida com a duração da gravação.
   */
  spotifyUrl?: string | null;
};

/**
 * Levar a música para o Spotify do fã — **em dois degraus**.
 *
 * ## Por que dois degraus, e não só "salvar"
 *
 * Salvar dentro do app usa `PUT /v1/me/tracks`, que exige OAuth do fã — e um
 * app em Development Mode atende **5 usuários autorizados**. Extended Quota
 * exige pessoa jurídica e **250 mil MAU**, então na prática o "salvar in-app"
 * hoje serve a beta testers, não ao público.
 *
 * O deep link não usa API nenhuma: é uma URL. Funciona para todo mundo, abre a
 * faixa certa no app onde o fã já está logado, e ele salva com um toque. De
 * quebra, a reprodução conta como stream para o artista.
 *
 * Por isso a ordem é: **vínculo existe → salva aqui; senão → abre no Spotify.**
 * Quando a quota vier, o primeiro caminho passa a valer para todos sem mudar
 * uma linha desta tela.
 *
 * ## O que mudou em relação à versão anterior
 *
 * Antes o componente retornava `null` para quem não tinha vínculo — ou seja,
 * para praticamente todo mundo, ele não existia. Agora quem não conectou vê o
 * caminho que funciona.
 *
 * ⚠️ Não há prévia de 30s para ouvir antes: `preview_url` foi descontinuado
 * pelo Spotify em 27/nov/2024 para apps criados depois disso, e vem sempre
 * `null`. A confirmação é visual (capa e álbum).
 */
export function SaveToSpotifyAction({ audienceId, title, artist, spotifyUrl }: Props) {
  const [candidate, setCandidate] = useState<SpotifyTrackCandidate | null>(null);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: status } = useSpotifyStatus(audienceId);
  const { search, save } = useSpotifyTrackSave(audienceId);

  const isLinked = !!status?.linked;

  // Sem vínculo e sem link resolvido não há o que oferecer: buscar exigiria o
  // token do fã, que é justamente o que não existe.
  if (!isLinked && !spotifyUrl) return null;

  if (saved) {
    return (
      <View style={s.doneRow}>
        <CheckCircle2 size={16} color={colors.status.success} />
        <Text style={s.doneText}>Salva na sua biblioteca do Spotify</Text>
      </View>
    );
  }

  async function openInSpotify() {
    if (!spotifyUrl) return;
    setError(null);
    try {
      await Linking.openURL(spotifyUrl);
    } catch {
      setError('Não foi possível abrir o Spotify.');
    }
  }

  async function findTrack() {
    setError(null);
    setNotFound(false);
    try {
      const result = await search.mutateAsync({ title, artist });
      if (!result.found || !result.track) {
        setNotFound(true);
        return;
      }
      setCandidate(result.track);
    } catch (err) {
      setError(getSpotifyErrorMessage(err));
    }
  }

  async function confirmSave() {
    if (!candidate) return;
    setError(null);
    try {
      await save.mutateAsync(candidate.id);
      setSaved(true);
    } catch (err) {
      setError(getSpotifyErrorMessage(err));
    }
  }

  if (!isLinked) {
    return (
      <View style={s.root}>
        <Pressable
          onPress={openInSpotify}
          style={s.cta}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${title} no Spotify`}
        >
          <ExternalLink size={16} color={colors.brand.primary} />
          <Text style={s.ctaText}>Abrir no Spotify</Text>
        </Pressable>
        {!!error && <ErrorBanner message={error} />}
      </View>
    );
  }

  return (
    <View style={s.root}>
      {candidate ? (
        <SpotifyTrackConfirmCard
          track={candidate}
          isSaving={save.isPending}
          onConfirm={confirmSave}
          onReject={() => setCandidate(null)}
        />
      ) : (
        <Pressable
          onPress={findTrack}
          disabled={search.isPending}
          style={s.cta}
          accessibilityRole="button"
          accessibilityLabel={`Salvar ${title} no Spotify`}
          accessibilityState={{ disabled: search.isPending }}
        >
          {search.isPending ? (
            <ActivityIndicator color={colors.brand.primary} />
          ) : (
            <>
              <Music4 size={16} color={colors.brand.primary} />
              <Text style={s.ctaText}>Salvar no meu Spotify</Text>
            </>
          )}
        </Pressable>
      )}

      {notFound && (
        <Text style={s.notFound}>Não encontramos essa música no Spotify.</Text>
      )}

      {!!error && <ErrorBanner message={error} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  cta: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm,
    minHeight:      48,
    borderRadius:   radius.xl,
    borderWidth:    1,
    borderColor:    colors.border.brand,
  },
  ctaText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  doneRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm,
    minHeight:      48,
  },
  doneText: {
    ...typography.bodySm,
    color: colors.status.success,
  },
  notFound: {
    ...typography.bodySm,
    color:     colors.text.muted,
    textAlign: 'center',
  },
});
