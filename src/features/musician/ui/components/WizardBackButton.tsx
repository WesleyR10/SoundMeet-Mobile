import { Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { spacing } from '@/shared/design-system/tokens';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = { onPress: () => void };

export function WizardBackButton({ onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={s.btn}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Voltar para a etapa anterior"
    >
      <ArrowLeft size={22} color={colors.text.primary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    position:       'absolute',
    top:            spacing.lg,
    left:           spacing.lg,
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         10,
  },
});
