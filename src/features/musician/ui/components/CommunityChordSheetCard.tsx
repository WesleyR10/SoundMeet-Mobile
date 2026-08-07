import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Globe2, Music2, PencilLine } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { useMusicLibraryItem } from '../../application/useMusicLibraryItem';
import { useMusician } from '../../application/useMusician';
import type { PersonalChordSheetSummary } from '../../domain/personal-chord-sheet.types';

type Props = {
  sheet: PersonalChordSheetSummary;
  onPress: () => void;
  riseDelay?: number;
};

export function CommunityChordSheetCard({ sheet, onPress, riseDelay = 0 }: Props) {
  const itemQuery = useMusicLibraryItem(sheet.music_library_id);
  const authorQuery = useMusician(sheet.musician_id);
  const authorName = authorQuery.data?.display_name || authorQuery.data?.stage_name || 'Músico SoundMeet';

  return (
    <Pressable3DCard onPress={onPress} accessibilityLabel={`Abrir cifra compartilhada ${itemQuery.data?.title ?? ''}`}>
      <GlowCard accentColor={colors.accent.violet} riseDelay={riseDelay} style={s.card}>
        <View style={s.header}>
          <View style={s.icon}>
            {itemQuery.isPending ? <ActivityIndicator size="small" color={colors.accent.violetLight} /> : <Music2 size={20} color={colors.accent.violetLight} />}
          </View>
          <View style={s.titleWrap}>
            <Text style={s.title} numberOfLines={1}>{itemQuery.data?.title ?? 'Música'}</Text>
            <Text style={s.artist} numberOfLines={1}>{itemQuery.data?.artist ?? 'Carregando artista…'}</Text>
            <Text style={s.author} numberOfLines={1}>Compartilhado por {authorName}</Text>
          </View>
        </View>
        <View style={s.badges}>
          <View style={s.badge}>
            <Globe2 size={12} color={colors.accent.violetLight} />
            <Text style={s.badgeText}>Comunidade</Text>
          </View>
          <View style={s.editBadge}>
            <PencilLine size={12} color={colors.brand.primary} />
            <Text style={s.editText}>{sheet.edit_count} {sheet.edit_count === 1 ? 'edição' : 'edições'}</Text>
          </View>
        </View>
      </GlowCard>
    </Pressable3DCard>
  );
}

const s = StyleSheet.create({
  card: { ...shadows.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 44, height: 44, borderRadius: radius.md, alignItems: 'center',
    justifyContent: 'center', backgroundColor: `${colors.accent.violet}24`,
  },
  titleWrap: { flex: 1, gap: 2 },
  title: { ...typography.title, color: colors.text.primary },
  artist: { ...typography.bodySm, color: colors.text.secondary },
  author: { ...typography.caption, color: colors.accent.violetLight },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  badge: {
    minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radius.full, backgroundColor: `${colors.accent.violet}24`, paddingHorizontal: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.accent.violetLight },
  editBadge: {
    minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radius.full, backgroundColor: colors.brand.muted, paddingHorizontal: spacing.sm,
  },
  editText: { ...typography.caption, color: colors.brand.primary },
});
