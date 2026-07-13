import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { User, Sparkles } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { AudienceProfile } from '../../domain/audience.types';

type Props = {
  audience: AudienceProfile;
  onPressLevel: () => void;
};

// Extraído de FanProfileScreen.tsx (limite de ~200 linhas/screen, CLAUDE.md).
export function FanProfileHero({ audience, onPressLevel }: Props) {
  return (
    <View style={s.hero}>
      <View style={s.avatarBox}>
        {audience.avatar ? (
          <Image source={{ uri: audience.avatar }} style={s.avatarImg} />
        ) : (
          <User size={36} color={colors.text.muted} />
        )}
      </View>
      <Text style={s.name}>{audience.nickname || audience.name}</Text>
      <Text style={s.email}>{audience.email}</Text>

      <Pressable
        onPress={onPressLevel}
        style={s.levelChip}
        accessibilityRole="button"
        accessibilityLabel="Ver gamificação"
      >
        <Sparkles size={14} color={colors.accent.amber} />
        <Text style={s.levelChipText}>Nível {audience.current_level} · {audience.points.total} pts</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs },
  avatarBox: {
    width:            84,
    height:           84,
    borderRadius:     42,
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
    borderWidth:       1,
    borderColor:      colors.border.default,
  },
  avatarImg: { width: '100%', height: '100%' },
  name: {
    ...typography.title,
    color:     colors.text.primary,
    marginTop:  spacing.sm,
  },
  email: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  levelChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.xs,
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius:      radius.full,
    backgroundColor:  `${colors.accent.amber}1F`,
    marginTop:          spacing.sm,
  },
  levelChipText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.amber,
  },
});
