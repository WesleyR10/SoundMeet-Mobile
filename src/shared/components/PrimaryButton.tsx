import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows, typography } from '@/shared/design-system/tokens';

type Variant = 'brand' | 'coral';

type Props = {
  label:     string;
  onPress:   () => void;
  loading?:  boolean;
  disabled?: boolean;
  variant?:  Variant;
  style?:    StyleProp<ViewStyle>;
};

const VARIANT_BG = {
  brand: colors.brand.primary,
  coral: colors.accent.coral,
} as const;

const VARIANT_BG_PRESSED = {
  brand: colors.brand.dark,
  coral: colors.accent.coralDeep,
} as const;

const VARIANT_SHADOW = {
  brand: shadows.brand,
  coral: shadows.coral,
} as const;

export function PrimaryButton({ label, onPress, loading = false, disabled = false, variant = 'brand', style }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        VARIANT_SHADOW[variant],
        { backgroundColor: VARIANT_BG[variant] },
        pressed && !isDisabled && { backgroundColor: VARIANT_BG_PRESSED[variant], transform: [{ scale: 0.98 }] },
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

const s = StyleSheet.create({
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
});
