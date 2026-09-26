import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Music4, Pause, Play, Trash2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import {
  formatDurationLabel,
  PRESENTATION_AUDIO_LIMITS,
  PRESENTATION_AUDIO_PICKER_TYPES,
  rejectPresentationAudio,
} from '../../domain/presentation-audio.rules';
import type { PresentationAudio } from '../../domain/musician.types';

type Props = {
  audio:      PresentationAudio | null;
  isSaving:   boolean;
  error:      string | null;
  onPick:     (file: { uri: string; name: string; type: string }) => void;
  onRemove:   () => void;
  onLocalError: (message: string | null) => void;
};

/**
 * Áudio de apresentação — o trecho de até 40s que o estabelecimento ouve antes
 * de contratar.
 *
 * **É ARQUIVO, não gravação.** Gravar pelo app pareceria mais integrado e
 * entregaria menos: o áudio que representa o artista costuma já existir (um
 * trecho de show, uma demo mixada), e forçar uma gravação de celular no lugar
 * dele trocaria o melhor material do músico pelo pior.
 *
 * 🔴 **A duração é medida AQUI, antes de subir.** Sem isso o músico esperaria
 * a subida de vários MB por rede móvel para receber um 422 previsível. O
 * servidor mede de novo e decide — esta checagem é cortesia, não defesa, e é
 * por isso que ela NÃO reprova quando não consegue medir: nem todo arquivo
 * permite ler a duração no aparelho, e transformar limitação do dispositivo em
 * impedimento de produto seria pior que subir e receber a recusa.
 */
const useStyles = makeStyles((colors) => ({
  hint: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.elevated,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.muted,
  },
  playerInfo: { flex: 1 },
  playerTitle: {
    ...typography.bodySm,
    color: colors.text.primary,
    fontWeight: '500',
  },
  playerMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  removeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.strong,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  measuring: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
}));

export function EditPresentationAudioSection({
  audio,
  isSaving,
  error,
  onPick,
  onRemove,
  onLocalError,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  /*
   * 🔴 O estado é a URL QUE ESTÁ TOCANDO, não um booleano "está tocando".
   *
   * Com um booleano, trocar o áudio exigiria `setIsPlaying(false)` dentro do
   * efeito que recria o player — e é exatamente isso que o
   * `react-hooks/set-state-in-effect` reprova (a mesma regra que ditou o
   * `useSyncExternalStore` do relógio no web). Guardando a URL, o "parou" cai
   * de graça na comparação: o áudio novo tem outra URL, então nada mais casa
   * e a tela volta sozinha ao estado parado, sem render em cascata.
   */
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const isPlaying = !!audio && playingUrl === audio.url;

  // O player só existe enquanto há áudio publicado. Trocar o arquivo recria —
  // reaproveitar o player com outra URL deixaria tocando o áudio anterior.
  useEffect(() => {
    if (!audio) {
      playerRef.current = null;
      return;
    }

    const player = createAudioPlayer({ uri: audio.url });
    playerRef.current = player;

    return () => {
      try {
        player.pause();
        player.remove();
      } catch {
        // Player já liberado pelo runtime — não há o que desfazer.
      }
      playerRef.current = null;
    };
  }, [audio]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player || !audio) return;

    if (isPlaying) {
      player.pause();
      setPlayingUrl(null);
      return;
    }

    // Volta ao início: um preview de 40s que retoma do meio na segunda escuta
    // deixa quem ouve sem o começo, que é onde o artista se apresenta.
    try {
      player.seekTo(0);
    } catch {
      // `seekTo` antes de o áudio carregar pode lançar; tocar do ponto atual
      // é melhor que não tocar.
    }
    player.play();
    setPlayingUrl(audio.url);
  }, [audio, isPlaying]);

  /**
   * Mede a duração localmente. Devolve `null` quando não dá — e "não dá" é um
   * resultado legítimo, não um erro a mostrar.
   */
  async function measureDuration(uri: string): Promise<number | null> {
    let probe: AudioPlayer | null = null;
    try {
      probe = createAudioPlayer({ uri });

      // O carregamento é assíncrono e a API não expõe promessa de "pronto":
      // sondamos por até ~2s. Passou disso, seguimos sem a duração — o
      // servidor mede de qualquer forma.
      for (let attempt = 0; attempt < 20; attempt++) {
        const duration = probe.duration;
        if (typeof duration === 'number' && duration > 0) return duration;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return null;
    } catch {
      return null;
    } finally {
      try {
        probe?.remove();
      } catch {
        // idem
      }
    }
  }

  async function handlePick() {
    onLocalError(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: PRESENTATION_AUDIO_PICKER_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setIsMeasuring(true);
    const duration = await measureDuration(asset.uri);
    setIsMeasuring(false);

    const rejection = rejectPresentationAudio({
      name: asset.name,
      size: asset.size,
      duration,
    });

    if (rejection) {
      onLocalError(rejection.message);
      return;
    }

    onPick({
      uri: asset.uri,
      name: asset.name,
      // `mimeType` do seletor é o que o SISTEMA declara e varia por aparelho
      // (Android manda `application/octet-stream` para MP3 com frequência).
      // Quem decide é o backend, lendo os bytes.
      type: asset.mimeType ?? 'audio/mpeg',
    });
  }

  return (
    <>
      <Text style={s.hint}>
        Um trecho de {PRESENTATION_AUDIO_LIMITS.MIN_SECONDS} a{' '}
        {PRESENTATION_AUDIO_LIMITS.MAX_SECONDS} segundos para o estabelecimento ouvir como você
        soa antes de chamar para um show. MP3, M4A, AAC ou WAV.
      </Text>

      {audio ? (
        <View style={s.player}>
          <Pressable
            style={s.playButton}
            onPress={togglePlay}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pausar seu áudio' : 'Ouvir seu áudio'}
          >
            {isPlaying ? (
              <Pause size={20} color={colors.brand.primary} />
            ) : (
              <Play size={20} color={colors.brand.primary} />
            )}
          </Pressable>

          <View style={s.playerInfo}>
            <Text style={s.playerTitle}>Seu áudio de apresentação</Text>
            <Text style={s.playerMeta}>{formatDurationLabel(audio.duration_seconds)}</Text>
          </View>

          <Pressable
            style={s.removeButton}
            onPress={onRemove}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Remover áudio de apresentação"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text.secondary} />
            ) : (
              <Trash2 size={20} color={colors.status.error} />
            )}
          </Pressable>
        </View>
      ) : (
        <View style={s.empty}>
          <Music4 size={20} color={colors.text.secondary} />
          <Text style={s.emptyText}>
            Nenhum áudio enviado. Quem procura artista vê seu perfil sem saber como você soa.
          </Text>
        </View>
      )}

      {error ? <ErrorBanner message={error} style={{ marginBottom: spacing.md }} /> : null}

      <PrimaryButton
        label={audio ? 'Trocar áudio' : 'Escolher arquivo'}
        onPress={handlePick}
        loading={isSaving || isMeasuring}
        disabled={isSaving || isMeasuring}
        variant="brand"
      />

      {isMeasuring ? <Text style={s.measuring}>Conferindo o arquivo…</Text> : null}
    </>
  );
}
