import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AlertTriangle, Music2, PencilLine, Users, Globe2 } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { useMusicLibraryItem } from '../../application/useMusicLibraryItem';
import { usePersonalChordSheetView } from '../../application/usePersonalChordSheetView';
import type { PersonalChordSheetSummary } from '../../domain/personal-chord-sheet.types';
import { ReconcileBadge } from './ReconcileBadge';

type Props = {
  sheet: PersonalChordSheetSummary;
  onPress: () => void;
  riseDelay?: number;
};

export function PersonalChordSheetCard({ sheet, onPress, riseDelay = 0 }: Props) {
  const itemQuery = useMusicLibraryItem(sheet.music_library_id);
  const viewQuery = usePersonalChordSheetView(sheet.musician_id, sheet.personal_chord_sheet_id);
  const conflictCount = viewQuery.data?.conflict_count ?? 0;

  return (
    <Pressable3DCard onPress={onPress} accessibilityLabel={`Abrir cifra pessoal ${itemQuery.data?.title ?? ''}`}>
      <GlowCard riseDelay={riseDelay} style={s.card}>
        <View style={s.header}>
          <View style={s.icon}>
            {itemQuery.isPending ? <ActivityIndicator size="small" color={colors.brand.primary} /> : <Music2 size={20} color={colors.brand.primary} />}
          </View>
          <View style={s.titleWrap}>
            <Text style={s.title} numberOfLines={1}>{itemQuery.data?.title ?? 'Música'}</Text>
            <Text style={s.artist} numberOfLines={1}>{itemQuery.data?.artist ?? 'Carregando artista…'}</Text>
          </View>
        </View>

        <View style={s.badges}>
          <View style={s.badge}>
            <PencilLine size={12} color={colors.brand.primary} />
            <Text style={s.badgeText}>{sheet.edit_count} {sheet.edit_count === 1 ? 'edição' : 'edições'}</Text>
          </View>
          {sheet.share_scope === 'band' && (
            <View style={[s.badge, s.bandBadge]}>
              <Users size={12} color={colors.brand.primary} />
              <Text style={[s.badgeText, s.bandText]}>Banda</Text>
            </View>
          )}
          {sheet.share_scope === 'community' && (
            <View style={[s.badge, s.communityBadge]}>
              <Globe2 size={12} color={colors.accent.violetLight} />
              <Text style={[s.badgeText, s.communityText]}>Comunidade</Text>
            </View>
          )}
          {conflictCount > 0 && (
            <View style={[s.badge, s.conflictBadge]}>
              <AlertTriangle size={12} color={colors.accent.coral} />
              <Text style={[s.badgeText, s.conflictText]}>{conflictCount} conflito{conflictCount > 1 ? 's' : ''}</Text>
            </View>
          )}
          {sheet.reconcile_status === 'base_updated' && <ReconcileBadge />}
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
    justifyContent: 'center', backgroundColor: colors.brand.muted,
  },
  titleWrap: { flex: 1, gap: 2 },
  title: { ...typography.title, color: colors.text.primary },
  artist: { ...typography.bodySm, color: colors.text.secondary },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  badge: {
    minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.text.secondary },
  bandBadge: { backgroundColor: colors.brand.muted },
  bandText: { color: colors.brand.primary },
  communityBadge: { backgroundColor: `${colors.accent.violet}24` },
  communityText: { color: colors.accent.violetLight },
  conflictBadge: { backgroundColor: `${colors.accent.coral}1F` },
  conflictText: { color: colors.accent.coral },
});
