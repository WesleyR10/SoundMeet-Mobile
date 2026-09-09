import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import type { RegisterRole } from '@/features/auth/domain/auth.types';

type Props = {
  role: RegisterRole;
};

/*
 * Função do tema, não constante de módulo: avaliada no carregamento, congelaria
 * a paleta escura.
 */
const roleMeta = (colors: ThemeColors) => ({
  musician: { emoji: '🎸', label: 'Cadastro de Músico', color: colors.brand.primary },
  audience: { emoji: '🎵', label: 'Cadastro de Fã',      color: colors.accent.coral },
}) as const;

export function RoleBadge({ role }: Props) {
  const { colors } = useTheme();
  const meta = roleMeta(colors)[role];

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
