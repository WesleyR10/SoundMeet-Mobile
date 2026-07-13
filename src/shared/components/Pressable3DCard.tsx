import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

type Props = {
  children:  ReactNode;
  onPress?:  () => void;
  style?:    StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
};

// Efeito "3D" de toque — profundidade via scale + translateY + rotateX leve
// (perspective), sem GestureDetector: usar Pan pra tilt-por-arraste dentro de
// listas horizontais (MusicianRecommendationCard) roubaria o gesto de scroll
// do FlatList. Pressable + Reanimated é seguro em qualquer contexto de scroll
// e já entrega a sensação de "cartão levantando" pedida — mesma filosofia de
// hand-rolling direto em Reanimated 4 usada no resto do app (sem lib nova).
export function Pressable3DCard({ children, onPress, style, disabled, accessibilityLabel }: Props) {
  const scale     = useSharedValue(1);
  const liftY     = useSharedValue(0);
  const rotateX   = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateY: liftY.value },
      { rotateX: `${rotateX.value}deg` },
      { scale: scale.value },
    ],
  }));

  function onPressIn() {
    scale.value   = withSpring(0.97, { damping: 14, stiffness: 260 });
    liftY.value   = withSpring(-3, { damping: 14, stiffness: 260 });
    rotateX.value = withSpring(3, { damping: 14, stiffness: 260 });
  }

  function onPressOut() {
    scale.value   = withSpring(1, { damping: 12, stiffness: 220 });
    liftY.value   = withSpring(0, { damping: 12, stiffness: 220 });
    rotateX.value = withSpring(0, { damping: 12, stiffness: 220 });
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
