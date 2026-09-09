import { View, Text } from 'react-native';
import { Music2, ListMusic } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';
import type { TopRequestedSong } from '../../domain/analytics.types';

type Props = {
  songs: TopRequestedSong[];
};

// Lista ranqueada — visual espelhado em TipHistoryItem/TipHistoryList
// (features/payment), mas componente próprio: FSD proíbe features/musician
// importar de features/payment (mesmo raciocínio já documentado pro par
// wallet.api.ts/musician-wallet.api.ts no roadmap-mobile.md).
const useStyles = makeStyles((colors) => ({
  list: {
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  count: {
    ...typography.mono,
    color: colors.accent.amber,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
}));

export function TopSongsList({ songs }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  if (songs.length === 0) {
    return (
      <View style={s.centerBox}>
        <ListMusic size={28} color={colors.text.muted} />
        <Text style={s.emptyText}>Nenhum pedido ainda — as músicas mais pedidas aparecem aqui.</Text>
      </View>
    );
  }

  return (
    <View style={s.list}>
      {songs.map((song, index) => (
        <GlowCard
          key={`${song.song_title}-${song.artist ?? ''}`}
          accentColor={colors.accent.amber}
          riseDelay={index * 60}
          style={s.card}
        >
          <View style={s.row}>
            <View style={s.iconBox}>
              <Music2 size={18} color={colors.accent.amber} />
            </View>

            <View style={s.info}>
              <Text style={s.title} numberOfLines={1}>{song.song_title}</Text>
              {song.artist ? (
                <Text style={s.artist} numberOfLines={1}>{song.artist}</Text>
              ) : null}
            </View>

            <Text style={s.count}>{song.count}×</Text>
          </View>
        </GlowCard>
      ))}
    </View>
  );
}
