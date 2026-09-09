import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { AvatarPicker } from '@/shared/components/AvatarPicker';

type Props = {
  avatarUri: string | null;
  onChangeAvatarUri: (uri: string) => void;
  error?:    string | null;
};

const useStyles = makeStyles((colors) => ({
  root: {
    gap:        spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.displayMd,
    color:      colors.text.primary,
    alignSelf:  'flex-start',
  },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    alignSelf: 'flex-start',
  },
  errorText: {
    ...typography.bodySm,
    color: colors.status.error,
  },
}));

export function StepThreePhoto({ avatarUri, onChangeAvatarUri, error }: Props) {
  const s = useStyles();
  const opacity = useSharedValue(0);
  const y       = useSharedValue(16);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 320 });
    y.value       = withTiming(0, { duration: 320 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[s.root, animStyle]}>
      <Text style={s.title}>Mostre seu rosto</Text>
      <Text style={s.subtitle}>Uma foto de perfil ajuda o público a te reconhecer no evento.</Text>

      <AvatarPicker uri={avatarUri} onChange={onChangeAvatarUri} />

      {!!error && <Text style={s.errorText}>{error}</Text>}
    </Animated.View>
  );
}
