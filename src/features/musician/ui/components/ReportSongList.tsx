import { View, Text, StyleSheet } from 'react-native';
import { Coins } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { PerformanceReportSong } from '@/shared/services/performance/performance.types';

type Props = {
  songs:           PerformanceReportSong[];
  attributionNote: string;
};

/**
 * O setlist do show, na ordem em que foi tocado.
 *
 * 🔴 A gorjeta por música é rotulada como ESTIMATIVA, com a nota que vem do
 * próprio backend. Afirmar "esta música rendeu R$ 40" seria inventar uma
 * relação que o dado não sustenta: o que existe é proximidade de horário, não
 * indicação do público. A nota viaja com o dado justamente para que a UI não
 * precise lembrar de escrevê-la.
 */
export function ReportSongList({ songs, attributionNote }: Props) {
  if (songs.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>
          Nenhuma música registrada neste show. Abrir uma música no Repertório
          durante o set é o que alimenta esta lista.
        </Text>
      </View>
    );
  }

  const hasAnyTip = songs.some((song) => song.tips_during_song > 0);

  return (
    <View style={s.root}>
      <Text style={s.heading}>Setlist</Text>

      {songs.map((song) => (
        <View key={song.id} style={s.row}>
          <Text style={s.position}>{String(song.position).padStart(2, '0')}</Text>

          <View style={s.info}>
            <Text style={s.title} numberOfLines={1}>{song.title}</Text>
            <Text style={s.artist} numberOfLines={1}>{song.artist}</Text>
          </View>

          <View style={s.meta}>
            {song.tips_during_song > 0 && (
              <View style={s.tipRow}>
                <Coins size={12} color={colors.accent.coral} />
                <Text style={s.tipText}>{song.tips_during_song}</Text>
              </View>
            )}
            <Text style={s.duration}>{formatDuration(song.duration_seconds)}</Text>
          </View>
        </View>
      ))}

      {hasAnyTip && <Text style={s.note}>{attributionNote}</Text>}
    </View>
  );
}

/** `null` = música nunca fechada. Um traço é honesto; "0:00" seria mentira. */
function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

const s = StyleSheet.create({
  root: {
    gap:             spacing.sm,
    padding:         spacing.lg,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  heading: {
    ...typography.bodySm,
    fontFamily:   'Inter-SemiBold',
    color:        colors.text.primary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  position: {
    ...typography.mono,
    color: colors.text.muted,
    width: 24,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.bodySm,
    color: colors.text.primary,
  },
  artist: {
    ...typography.caption,
    color: colors.text.muted,
  },
  meta: {
    alignItems: 'flex-end',
    gap:        2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            3,
  },
  tipText: {
    ...typography.caption,
    color: colors.accent.coral,
  },
  duration: {
    ...typography.caption,
    color: colors.text.muted,
  },
  note: {
    ...typography.caption,
    color:     colors.text.muted,
    marginTop: spacing.xs,
  },
  empty: {
    padding:         spacing.lg,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
});
