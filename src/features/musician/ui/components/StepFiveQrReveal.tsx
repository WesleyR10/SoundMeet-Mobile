import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { QRFrame } from '@/shared/components/QRFrame';
import { ConfettiBurst } from '@/shared/components/ConfettiBurst';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';

type Props = {
  qrCode:   string | null;
  onGoHome: () => void;
};

// O "momento de pagamento" do wizard: título entra primeiro, o QR materializa em
// seguida (spring), e assim que ele se assenta o confete dispara — só então o CTA
// aparece. Entrada só toca depois que o PATCH final já confirmou sucesso (ver
// MusicianSetupWizardScreen), então o reveal nunca é "prometido" antes da hora.
const useStyles = makeStyles((colors) => ({
  root: {
    alignItems: 'center',
    gap:         spacing.xxl,
  },
  title: {
    ...typography.displayMd,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color:        colors.text.secondary,
    textAlign:    'center',
    marginTop:    spacing.sm,
    paddingHorizontal: spacing.md,
  },
  qrArea: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  fallback: {
    ...typography.body,
    color:     colors.status.error,
    textAlign: 'center',
    maxWidth:  240,
  },
  ctaWrap: {
    alignSelf: 'stretch',
  },
}));

export function StepFiveQrReveal({ qrCode, onGoHome }: Props) {
  const s = useStyles();
  const [burstOn, setBurstOn] = useState(false);

  const titleOpacity = useSharedValue(0);
  const titleY        = useSharedValue(12);
  const qrScale        = useSharedValue(0.7);
  const qrOpacity      = useSharedValue(0);
  const ctaOpacity     = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 260 });
    titleY.value        = withTiming(0, { duration: 260 });

    qrOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
    qrScale.value    = withDelay(150, withSpring(1, { damping: 9, stiffness: 120 }));

    ctaOpacity.value = withDelay(650, withTiming(1, { duration: 300 }));

    // Timer JS simples em vez de acoplar ao callback do withSpring — o burst só
    // precisa coincidir aproximadamente com o QR se assentando (spring settle ~450ms).
    const t = setTimeout(() => setBurstOn(true), 450);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity:   titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const qrStyle = useAnimatedStyle(() => ({
    opacity:   qrOpacity.value,
    transform: [{ scale: qrScale.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  return (
    <View style={s.root}>
      <Animated.View style={titleStyle}>
        <Text style={s.title}>Seu QR Code está pronto 🎉</Text>
        <Text style={s.subtitle}>Mostre na mesa, cole no palco ou compartilhe — é por aqui que o público te encontra.</Text>
      </Animated.View>

      <View style={s.qrArea}>
        <Animated.View style={qrStyle}>
          {qrCode ? (
            <QRFrame value={qrCode} />
          ) : (
            <Text style={s.fallback}>QR indisponível — tente novamente mais tarde.</Text>
          )}
        </Animated.View>
        <ConfettiBurst trigger={burstOn} />
      </View>

      <Animated.View style={[s.ctaWrap, ctaStyle]}>
        <PrimaryButton label="Ir para minha home" onPress={onGoHome} />
      </Animated.View>
    </View>
  );
}
