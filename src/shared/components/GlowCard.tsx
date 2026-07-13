import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { colors, spacing, radius } from '@/shared/design-system/tokens';

type Props = {
  children:     ReactNode;
  accentColor?: string;
  style?:       StyleProp<ViewStyle>;
  // Stagger em ms pra entrada tipo `hm-rise` (Claude Design/project/Home do
  // Músico.dc.html) — cada card/linha de uma lista passa um delay crescente.
  riseDelay?:   number;
  animated?:    boolean;
};

// Primitivo único reaproveitado pelos ~4 tipos de card da Home do músico
// (Próximo Show, Acesso Rápido, Descoberta, Atividade Recente) — evita 4
// estilizações quase-duplicadas de borda/fundo/raio na mesma tela.
export function GlowCard({ children, accentColor = colors.brand.primary, style, riseDelay = 0, animated = true }: Props) {
  const translateY = useSharedValue(animated ? 18 : 0);
  const opacity     = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    translateY.value = withDelay(riseDelay, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }));
    opacity.value     = withDelay(riseDelay, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrance = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[s.card, { borderColor: `${accentColor}40` }, entrance, style]}>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius:    radius.lg,
    borderWidth:      1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:          spacing.lg,
    gap:              spacing.sm,
  },
});
