import { useEffect } from 'react';
import { TextInput } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Props = {
  value:     number;
  duration?: number;
  style?:    StyleProp<TextStyle>;
};

// Formata centavos como "R$ 1.234,56" à mão dentro do worklet — toLocaleString/
// Intl não são garantidos em worklets (thread de UI, JSI, sem polyfill completo
// do Hermes nesse contexto).
function formatBRL(value: number): string {
  'worklet';
  const cents    = Math.round(value * 100);
  const sign     = cents < 0 ? '-' : '';
  const abs      = Math.abs(cents);
  const intPart  = Math.floor(abs / 100);
  const centPart = abs % 100;

  let intStr   = `${intPart}`;
  let withDots = '';
  let count    = 0;
  for (let i = intStr.length - 1; i >= 0; i--) {
    withDots = intStr[i] + withDots;
    count++;
    if (count % 3 === 0 && i !== 0) withDots = `.${withDots}`;
  }
  const centStr = centPart < 10 ? `0${centPart}` : `${centPart}`;
  return `${sign}R$ ${withDots},${centStr}`;
}

// Contador animado sem precedente no projeto (nenhum count-up hoje —
// useAnimatedProps só aparece em TravelingBorderGlow/WizardProgress, nunca pra
// texto). TextInput animado (editable=false) porque Reanimated 4 não consegue
// animar o conteúdo de <Text> diretamente; animatedProps.text evita re-render
// React a cada frame (roda inteiro na UI thread).
const useStyles = makeStyles((colors) => ({
  text: {
    ...typography.displayMd,
    color:   colors.text.primary,
    padding: 0,
  },
}));

export function AnimatedBalance({ value, duration = 900, style }: Props) {
  const s = useStyles();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    return { text: formatBRL(progress.value * value) } as unknown as Record<string, unknown>;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      caretHidden
      defaultValue={formatBRL(0)}
      animatedProps={animatedProps}
      style={[s.text, style]}
    />
  );
}
