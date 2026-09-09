import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing } from 'react-native-reanimated';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';

type Props = {
  label: string;
};

// Badge efêmero mostrado quando o Play Mode entra numa seção nova (refrão,
// verso etc.) — aviso rápido sem poluir a tela permanentemente. O chamador
// (PlayModeScreen) remonta este componente via `key` a cada troca de seção
// — remount já reinicia a animação sozinho, sem precisar de trigger
// imperativo nem de estado externo pra saber "já mostrei esse".
const useStyles = makeStyles((colors) => ({
  root: {
    alignSelf:          'center',
    paddingHorizontal:  spacing.md,
    paddingVertical:    spacing.xs,
    borderRadius:       radius.full,
    backgroundColor:    colors.bg.elevated,
    borderWidth:         1,
    borderColor:        colors.border.brand,
    ...shadows.brand,
  },
  label: {
    ...typography.caption,
    color:          colors.brand.primary,
    letterSpacing:   1,
    textTransform:  'uppercase',
  },
}));

export function SectionTransitionBadge({ label }: Props) {
  const s = useStyles();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withDelay(1400, withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) })),
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -6 }],
  }));

  return (
    <Animated.View style={[s.root, animatedStyle]} pointerEvents="none">
      <Text style={s.label} numberOfLines={1}>{label}</Text>
    </Animated.View>
  );
}
