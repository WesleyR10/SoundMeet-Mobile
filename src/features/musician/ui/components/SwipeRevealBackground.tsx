import { StyleSheet } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Check, X } from 'lucide-react-native';
import { radius } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  acceptStyle: AnimatedStyle;
  rejectStyle: AnimatedStyle;
};

// Extraído de RequestCard.tsx (limite de ~200 linhas/arquivo) — os dois
// fundos revelados atrás do card durante o swipe (teal=aceitar à esquerda,
// coral=rejeitar à direita). Puramente decorativo/posicional, sem gesto ou
// estado próprio — recebe as animated styles já computadas pelo pai.
const useStyles = makeStyles((colors) => ({
  bg: {
    position:       'absolute',
    top:             0,
    bottom:          0,
    width:           '50%',
    borderRadius:    radius.lg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  bgAccept: { left: 0, backgroundColor: colors.brand.primary },
  bgReject: { right: 0, backgroundColor: colors.accent.coral },
}));

export function SwipeRevealBackground({ acceptStyle, rejectStyle }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <>
      <Animated.View style={[s.bg, s.bgAccept, acceptStyle]}>
        <Check size={28} color={colors.text.inverse} />
      </Animated.View>
      <Animated.View style={[s.bg, s.bgReject, rejectStyle]}>
        <X size={28} color={colors.text.inverse} />
      </Animated.View>
    </>
  );
}
