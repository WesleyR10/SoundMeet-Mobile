import { useEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { typography, colors } from '@/shared/design-system/tokens';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function formatInteger(value: number): string {
  'worklet';
  return `${Math.round(value)}`;
}

type Props = {
  value:      number;
  duration?:  number;
  style?:     StyleProp<TextStyle>;
  formatter?: (value: number) => string; // worklet
};

// Irmão de AnimatedBalance (Bloco 5) para contagens inteiras simples (pedidos
// aceitos/rejeitados, músicas mais pedidas) — AnimatedBalance formata BRL
// internamente e não serve pra isso. Mesma mecânica: useAnimatedProps sobre
// TextInput (editable=false) porque Reanimated 4 não anima o conteúdo de
// <Text> diretamente.
export function AnimatedCounter({ value, duration = 700, style, formatter = formatInteger }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    return { text: formatter(progress.value * value) } as unknown as Record<string, unknown>;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      caretHidden
      defaultValue={formatter(0)}
      animatedProps={animatedProps}
      style={[s.text, style]}
    />
  );
}

const s = StyleSheet.create({
  text: {
    ...typography.displayMd,
    color:   colors.text.primary,
    padding: 0,
  },
});
