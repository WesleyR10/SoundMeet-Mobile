import { ActivityIndicator, Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { spacing, radius, shadows, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';

type Variant = 'brand' | 'coral';

type Props = {
  label:     string;
  onPress:   () => void;
  loading?:  boolean;
  disabled?: boolean;
  variant?:  Variant;
  style?:    StyleProp<ViewStyle>;
};

/*
 * Os mapas de cor viraram FUNÇÕES do tema. Como constante de módulo eles
 * congelavam a paleta dark no carregamento — o botão primário continuaria
 * teal-neon sobre um fundo claro. As sombras não: `shadows.*` é geometria e
 * opacidade, não muda com o tema.
 */
const variantBg = (colors: ThemeColors) => ({
  brand: colors.brand.primary,
  coral: colors.accent.coral,
});

const variantBgPressed = (colors: ThemeColors) => ({
  brand: colors.brand.dark,
  coral: colors.accent.coralDeep,
});

const VARIANT_SHADOW = {
  brand: shadows.brand,
  coral: shadows.coral,
} as const;

const useStyles = makeStyles((colors) => ({
  btn: {
    height:         60,
    borderRadius:   radius.xl,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.sm,
  },
  disabled: {
    opacity:      0.4,
    shadowOpacity: 0,
    elevation:     0,
  },
  label: {
    ...typography.bodyLg,
    fontFamily:    'SpaceGrotesk-Bold',
    letterSpacing:  1,
    color:          colors.text.inverse,
  },
}));

export function PrimaryButton({ label, onPress, loading = false, disabled = false, variant = 'brand', style }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const bg = variantBg(colors);
  const bgPressed = variantBgPressed(colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        VARIANT_SHADOW[variant],
        { backgroundColor: bg[variant] },
        pressed && !isDisabled && { backgroundColor: bgPressed[variant], transform: [{ scale: 0.98 }] },
        isDisabled && s.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} />
      ) : (
        <Text style={s.label}>{label}</Text>
      )}
    </Pressable>
  );
}
