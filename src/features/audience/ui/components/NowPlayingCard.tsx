import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Radio } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { useLivePerformance } from '../../application/useLivePerformance';
import { SaveToSpotifyAction } from './SaveToSpotifyAction';

type Props = {
  musicianId:  string;
  eventId:     string | undefined;
  audienceId:  string | null;
};

/**
 * "Tocando agora" — a música que o artista está executando NESTE momento.
 *
 * ## O que este card conserta
 *
 * Até 21/ago/2026 o `SaveToSpotifyAction` existia num lugar só: a tela de
 * sucesso do pedido de música, com título e artista digitados pelo próprio fã.
 * Era "salve o que você pediu", nunca "salve o que você está ouvindo" — o
 * sistema simplesmente não sabia o que estava tocando. Agora sabe, e o mesmo
 * componente de salvar recebe o par vindo do palco.
 *
 * Quando o músico passa para a próxima, o polling troca o card e o botão passa
 * a valer para a nova música — sem nenhuma ação do fã.
 *
 * ## Some quando não há nada tocando
 *
 * Sem `eventId` (fã que abriu o perfil fora de um show), sem set aberto, ou no
 * intervalo entre duas músicas, o card não renderiza. Um card vazio dizendo
 * "nada tocando" ocuparia o topo do perfil com a informação menos útil da tela.
 */
export function NowPlayingCard({ musicianId, eventId, audienceId }: Props) {
  const { data, isPending } = useLivePerformance(musicianId, eventId);

  if (!eventId) return null;

  if (isPending) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  const song = data?.is_live ? data.current_song : null;
  if (!song) return null;

  return (
    <View style={s.root}>
      <View style={s.badgeRow}>
        <View style={s.dot} />
        <Radio size={13} color={colors.status.success} />
        <Text style={s.badgeText}>TOCANDO AGORA</Text>
      </View>

      <Text style={s.title} numberOfLines={2}>
        {song.title}
      </Text>
      <Text style={s.artist} numberOfLines={1}>
        {song.artist}
      </Text>

      {/*
        Mesmo componente de sempre — só a origem do par mudou. Ele já não
        renderiza nada para quem não conectou o Spotify, então o convite para
        conectar continua morando só no perfil do fã.
      */}
      <SaveToSpotifyAction
        // `key` pelo id da execução: sem isto, o estado interno de "salva" e o
        // candidato confirmado sobreviveriam à troca de música, e o fã veria
        // "Salva na sua biblioteca" para uma música que ele nunca salvou.
        key={song.id}
        audienceId={audienceId}
        title={song.title}
        artist={song.artist}
        // A faixa já foi casada no pipeline, com a duração da gravação que o
        // músico analisou — é o que separa estúdio de ao vivo. Nenhuma busca
        // acontece no palco.
        spotifyUrl={song.spotify_url}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap:               spacing.xs,
    padding:           spacing.lg,
    borderRadius:      radius.xl,
    borderWidth:       1,
    borderColor:       colors.border.brand,
    backgroundColor:   colors.bg.elevated,
  },
  loading: {
    paddingVertical: spacing.lg,
    alignItems:      'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  dot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: colors.status.success,
  },
  badgeText: {
    ...typography.caption,
    fontFamily:    'Inter-SemiBold',
    letterSpacing: 1,
    color:         colors.status.success,
  },
  title: {
    ...typography.title,
    color:     colors.text.primary,
    marginTop: spacing.xs,
  },
  artist: {
    ...typography.body,
    color:        colors.text.secondary,
    marginBottom: spacing.sm,
  },
});
