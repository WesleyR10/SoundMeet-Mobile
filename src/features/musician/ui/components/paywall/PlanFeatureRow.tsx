import { View, Text } from 'react-native';
import { Check, Minus } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  label:    string;
  included: boolean;
};

const useStyles = makeStyles((colors) => ({
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
}));

export function PlanFeatureRow({ label, included }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
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
