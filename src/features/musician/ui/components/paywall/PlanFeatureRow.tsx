import { View, Text, StyleSheet } from 'react-native';
import { Check, Minus } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';

type Props = {
  label:    string;
  included: boolean;
};

export function PlanFeatureRow({ label, included }: Props) {
  return (
    <View style={s.row}>
      {included ? (
        <Check size={16} color={colors.brand.primary} />
      ) : (
        <Minus size={16} color={colors.text.muted} />
      )}
      <Text style={[s.label, !included && s.labelExcluded]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  label: {
    ...typography.bodySm,
    color:      colors.text.primary,
    flexShrink:  1,
  },
  labelExcluded: {
    color: colors.text.muted,
  },
});
