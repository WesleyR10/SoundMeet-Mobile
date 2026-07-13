import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { RegisterRole } from '@/features/auth/domain/auth.types';

type Props = {
  role: RegisterRole;
};

const ROLE_META: Record<RegisterRole, { emoji: string; label: string; color: string }> = {
  musician: { emoji: '🎸', label: 'Cadastro de Músico', color: colors.brand.primary },
  audience: { emoji: '🎵', label: 'Cadastro de Fã',      color: colors.accent.coral },
};

export function RoleBadge({ role }: Props) {
  const meta = ROLE_META[role];

  return (
    <View style={[s.badge, { borderColor: `${meta.color}4D`, backgroundColor: `${meta.color}1A` }]}>
      <Text style={s.emoji}>{meta.emoji}</Text>
      <Text style={[s.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    alignSelf:          'flex-start',
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.xs,
    borderWidth:         1,
    borderRadius:        radius.full,
    paddingVertical:     6,
    paddingHorizontal:   spacing.md,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.4,
  },
});
