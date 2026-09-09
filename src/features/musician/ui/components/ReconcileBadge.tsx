import { View, Text } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

const useStyles = makeStyles((colors) => ({
  badge: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.elevated,
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
}));

export function ReconcileBadge() {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.badge} accessibilityLabel="A cifra base foi atualizada">
      <RefreshCw size={12} color={colors.text.secondary} />
      <Text style={s.label}>Base atualizada</Text>
    </View>
  );
}
