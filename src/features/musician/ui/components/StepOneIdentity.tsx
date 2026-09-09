import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { FormField } from '@/shared/components/FormField';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { STAGE_NAME_SOFT_MAX, BIO_SOFT_MAX, type Step1FieldErrors } from '../../domain/musician.validation';

type Props = {
  stageName:        string;
  bio:               string;
  errors:            Step1FieldErrors;
  onChangeStageName: (v: string) => void;
  onChangeBio:       (v: string) => void;
};

const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  field: {
    gap: spacing.xs,
  },
  counter: {
    ...typography.caption,
    color:      colors.text.muted,
    textAlign:  'right',
  },
}));

export function StepOneIdentity({ stageName, bio, errors, onChangeStageName, onChangeBio }: Props) {
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
      <Text style={s.title}>Como você se apresenta no palco?</Text>
      <Text style={s.subtitle}>Seu nome artístico aparece no QR Code que o público vai escanear.</Text>

      <View style={s.field}>
        <FormField
          label="Nome artístico"
          value={stageName}
          onChangeText={(v) => onChangeStageName(v.slice(0, STAGE_NAME_SOFT_MAX))}
          placeholder="Ex.: Lari Acústico"
          error={errors.stageName}
          autoCapitalize="words"
        />
        <Text style={s.counter}>{stageName.length}/{STAGE_NAME_SOFT_MAX}</Text>
      </View>

      <View style={s.field}>
        <FormField
          label="Bio curta (opcional)"
          value={bio}
          onChangeText={(v) => onChangeBio(v.slice(0, BIO_SOFT_MAX))}
          placeholder="Ex.: Voz e violão, do samba ao rock. 10 anos de estrada e repertório aberto a pedidos."
          autoCapitalize="sentences"
          multiline
        />
        <Text style={s.counter}>{bio.length}/{BIO_SOFT_MAX}</Text>
      </View>
    </Animated.View>
  );
}
