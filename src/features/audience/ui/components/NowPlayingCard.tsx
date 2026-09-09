import { View, Text, ActivityIndicator } from 'react-native';
import { Radio, Gift } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
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
const useStyles = makeStyles((colors) => ({
  dedication: {
    flexDirection:   'row',
    gap:              spacing.sm,
    alignItems:      'flex-start',
    marginTop:        spacing.md,
    padding:          spacing.md,
    borderRadius:     radius.md,
    borderLeftWidth:  3,
    borderLeftColor:  colors.accent.coral,
    backgroundColor: `${colors.accent.coral}12`,
  },
  dedicationText: {
    ...typography.body,
    flex:       1,
    color:      colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 21,
  },
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
}));

export function NowPlayingCard({ musicianId, eventId, audienceId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
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

  // A dedicatória do destaque pago. O backend só a envia depois do pagamento
  // confirmado (`Request.publicDedication`) — aqui é só exibir.
  const dedication = data?.current_song_dedication ?? null;

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
        O momento que o destaque comprou: a dedicatória aparece na tela de
        todo mundo que está no show, junto da música tocando.
      */}
      {!!dedication && (
        <View style={s.dedication}>
          <Gift size={14} color={colors.accent.coral} />
          <Text style={s.dedicationText} numberOfLines={3}>
            {dedication}
          </Text>
        </View>
      )}

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
