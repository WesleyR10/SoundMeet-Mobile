import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';

type Props = {
  icon:     LucideIcon;
  title:    string;
  subtitle?: string;
};

// Estado vazio reutilizável entre telas do fã (feed sem resultado, busca sem
// match, evento sem performers, etc.) — reduz duplicação de 4+ telas.
export function EmptyState({ icon: Icon, title, subtitle }: Props) {
  return (
    <View style={s.root}>
      <Icon size={44} color={colors.text.muted} />
      <Text style={s.title}>{title}</Text>
      {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
    maxWidth:  280,
  },
});
