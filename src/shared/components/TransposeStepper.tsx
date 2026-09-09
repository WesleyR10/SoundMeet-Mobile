import { View, Text, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  value:    number; // semitons relativos ao tom original (0 = original)
  onChange: (value: number) => void;
  min?:     number;
  max?:     number;
};

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    borderRadius:   radius.lg,
    borderWidth:     1,
    borderColor:    colors.border.default,
    paddingHorizontal: spacing.sm,
    height:          52,
  },
  btn: {
    width:          40,
    height:         40,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.muted,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  label: {
    ...typography.body,
    fontFamily: 'JetBrainsMono-Bold',
    color:      colors.text.primary,
    flex:        1,
    textAlign:  'center',
  },
}));

export function TransposeStepper({ value, onChange, min = -11, max = 11 }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const step = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(min, Math.min(max, value + delta)));
  };

  const label = value === 0
    ? 'Tom original'
    : `${value > 0 ? '+' : ''}${value} semitom${Math.abs(value) === 1 ? '' : 's'}`;

  return (
    <View style={s.row}>
      <Pressable
        onPress={() => step(-1)}
        disabled={value <= min}
        style={[s.btn, value <= min && s.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Abaixar meio tom"
        hitSlop={8}
      >
        <Minus size={18} color={colors.text.primary} />
      </Pressable>

      <Text style={s.label} numberOfLines={1}>{label}</Text>

      <Pressable
        onPress={() => step(1)}
        disabled={value >= max}
        style={[s.btn, value >= max && s.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Subir meio tom"
        hitSlop={8}
      >
        <Plus size={18} color={colors.text.primary} />
      </Pressable>
    </View>
  );
}
