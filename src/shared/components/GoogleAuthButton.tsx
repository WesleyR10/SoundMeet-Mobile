import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  label?:    string;
  onPress:   () => void;
  loading?:  boolean;
  disabled?: boolean;
};

const useStyles = makeStyles((colors) => ({
  btn: {
    height:            56,
    borderRadius:       radius.lg,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    colors.bg.surface,
    flexDirection:      'row',
    alignItems:         'center',
    justifyContent:     'center',
    gap:                 spacing.sm,
  },
  pressed: {
    opacity:   0.75,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.4,
  },
  badge: {
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: colors.text.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  badgeText: {
    ...typography.caption,
    fontFamily: 'Inter-Bold',
    color:      colors.bg.primary,
  },
  label: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
}));

export function GoogleAuthButton({ label = 'Continuar com Google', onPress, loading = false, disabled = false }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [s.btn, pressed && !isDisabled && s.pressed, isDisabled && s.disabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : (
        <>
          <View style={s.badge}>
            <Text style={s.badgeText}>G</Text>
          </View>
          <Text style={s.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
