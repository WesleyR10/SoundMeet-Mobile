import { View, Text, StyleSheet } from 'react-native';
import { Music2, Share2, Users } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import type { Repertoire } from '../../domain/repertoire.types';

type Props = {
  repertoire: Repertoire;
  onPress:    () => void;
  riseDelay?: number;
};

export function RepertoireCard({ repertoire, onPress, riseDelay = 0 }: Props) {
  return (
    <Pressable3DCard onPress={onPress} accessibilityLabel={`Abrir repertório ${repertoire.name}`}>
      <GlowCard riseDelay={riseDelay} style={s.card}>
        <View style={s.header}>
          <View style={s.iconWrap}>
            <Music2 size={20} color={colors.brand.primary} />
          </View>
          <View style={s.headerText}>
            <Text style={s.name} numberOfLines={1}>{repertoire.name}</Text>
            <Text style={s.subtitle}>
              {repertoire.song_count} {repertoire.song_count === 1 ? 'música' : 'músicas'}
              {repertoire.estimated_show_duration_minutes != null
                ? ` · ~${Math.round(repertoire.estimated_show_duration_minutes)} min`
                : ''}
            </Text>
          </View>
        </View>

        {(repertoire.is_shared || repertoire.invitees.length > 0) && (
          <View style={s.badgeRow}>
            {repertoire.is_shared && (
              <View style={s.badge}>
                <Share2 size={12} color={colors.brand.primary} />
                <Text style={s.badgeText}>Compartilhado</Text>
              </View>
            )}
            {repertoire.invitees.length > 0 && (
              <View style={s.badge}>
                <Users size={12} color={colors.accent.violet} />
                <Text style={s.badgeText}>{repertoire.invitees.length} convidado{repertoire.invitees.length > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        )}
      </GlowCard>
    </Pressable3DCard>
  );
}

const s = StyleSheet.create({
  card: {
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  iconWrap: {
    width:           44,
    height:          44,
    borderRadius:    radius.md,
    backgroundColor: colors.brand.muted,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerText: {
    flex: 1,
    gap:   2,
  },
  name: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap:            spacing.sm,
    marginTop:      spacing.xs,
  },
  badge: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.xs,
    borderRadius:       radius.sm,
    paddingHorizontal:  spacing.sm,
    paddingVertical:    4,
    backgroundColor:    'rgba(255,255,255,0.05)',
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
