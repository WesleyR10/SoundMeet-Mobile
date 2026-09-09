import { View, Text, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  value:    number; // 0.5..2
  onChange: (value: number) => void;
  min?:     number;
  max?:     number;
  step?:    number;
};

// Mesmo molde de TransposeStepper, adaptado pra valor decimal (0.5–2, passo
// 0.25) — mesma formatação "×" do PlayModeBottomBar (speedMultiplier).
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

export function ScrollSpeedStepper({ value, onChange, min = 0.5, max = 2, step = 0.25 }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const stepBy = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.round((value + delta) * 100) / 100;
    onChange(Math.max(min, Math.min(max, next)));
  };

  return (
    <View style={s.row}>
      <Pressable
        onPress={() => stepBy(-step)}
        disabled={value <= min}
        style={[s.btn, value <= min && s.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Diminuir velocidade de rolagem"
        hitSlop={8}
      >
        <Minus size={18} color={colors.text.primary} />
      </Pressable>

      <Text style={s.label}>{value.toFixed(2)}×</Text>

      <Pressable
        onPress={() => stepBy(step)}
        disabled={value >= max}
        style={[s.btn, value >= max && s.btnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Aumentar velocidade de rolagem"
        hitSlop={8}
      >
        <Plus size={18} color={colors.text.primary} />
      </Pressable>
    </View>
  );
}
