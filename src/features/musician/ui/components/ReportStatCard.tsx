import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  icon:         LucideIcon;
  value:        string;
  label:        string;
  /** Segunda linha opcional — o número que qualifica o principal. */
  hint?:        string;
  accentColor:  string;
};

/**
 * Célula do relatório pós-show. Duas por linha (48%), para caber "R$ 1.234,56"
 * sem quebrar — o valor de gorjeta é o texto mais largo da grade.
 */
export function ReportStatCard({ icon: Icon, value, label, hint, accentColor }: Props) {
  return (
    <View style={s.root}>
      <Icon size={17} color={accentColor} />
      <Text style={[s.value, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.label}>{label}</Text>
      {!!hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width:           '48%',
    gap:             2,
    padding:         spacing.lg,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  value: {
    ...typography.title,
    marginTop: spacing.xs,
  },
  label: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
