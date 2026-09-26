import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { checkPasswordRules, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/features/auth/domain/auth.validation';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { withAlpha } from '@/shared/design-system/withAlpha';

type Props = {
  password: string;
};

function Rule({ met, label }: { met: boolean; label: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(met ? 1.15 : 1, { damping: 10 });
    const t = setTimeout(() => { scale.value = withSpring(1, { damping: 10 }); }, 180);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [met]);

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={s.row}>
      <Animated.View style={[s.dot, dotStyle, { backgroundColor: met ? colors.status.success : withAlpha(colors.text.primary, 0.08) }]}>
        {met && <Check size={11} color={colors.text.inverse} strokeWidth={3} />}
      </Animated.View>
      <Text style={[s.label, met && s.labelMet]}>{label}</Text>
    </View>
  );
}

export function PasswordStrengthHint({ password }: Props) {
  const s = useStyles();
  const rules = checkPasswordRules(password);

  return (
    <View style={s.container}>
      <Rule met={rules.hasLength}    label={`${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} caracteres`} />
      <Rule met={rules.hasUppercase} label="1 letra maiúscula" />
      <Rule met={rules.hasNumber}    label="1 número" />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  dot: {
    width:          16,
    height:         16,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
  },
  labelMet: {
    color: colors.text.secondary,
  },
}));
