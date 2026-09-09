import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  label:        string;
  icon:         LucideIcon;
  isFocused:    boolean;
  pendingCount: number;
  onPress:      () => void;
};

// Extraído de MusicianTabBar.tsx (limite de ~200 linhas/arquivo). Espelha o
// estilo de `Claude Design/project/Home do Músico.dc.html`: círculo 50px com
// gradiente coral (120deg, #FF6B6B→#ff8a5b) que "sai pra fora" da barra
// (posicionamento absoluto, não transform — ver nota abaixo), ícone quase-preto
// (#2a0d0d), label embaixo alinhado com as outras abas.
//
// Bug corrigido aqui: a versão anterior usava `transform:translateY(-18)` no
// círculo + `marginTop:-14` no label pra "puxar" o label pra cima. Transform
// não afeta o fluxo do layout — só desenha deslocado — então o label (que vem
// logo depois do círculo no fluxo normal) ficava puxado pra CIMA do próprio
// círculo, coral-sobre-coral, e sumia visualmente (era o "sem label" que
// apareceu no device). Fix: o círculo agora é `position:absolute` de verdade
// (sai do fluxo), e um spacer invisível do tamanho do ícone das outras abas
// mantém o label na mesma altura da linha de base dos demais.
const useStyles = makeStyles((colors) => ({
  fabWrap: {
    alignItems: 'center',
    gap:         4,
    width:       60,
  },
  // Reserva o mesmo espaço vertical do ícone (22px) das outras abas, sem
  // desenhar nada — mantém o label alinhado com os demais mesmo com o
  // círculo saindo do fluxo normal (position:absolute).
  spacer: {
    height: 22,
  },
  fab: {
    position:        'absolute',
    top:             -30,
    alignSelf:       'center',
    width:           50,
    height:          50,
    borderRadius:    25,
    backgroundColor: colors.accent.coral,
    shadowColor:     colors.accent.coral,
    shadowOffset:    { width: 0, height: 8 },
    elevation:        8,
  },
  ring: {
    position:     'absolute',
    top:          -3,
    left:         -3,
    right:        -3,
    bottom:       -3,
    borderRadius: 28,
    borderColor:  colors.brand.primary,
  },
  fabFill: {
    flex:            1,
    borderRadius:    25,
    alignItems:      'center',
    justifyContent:  'center',
  },
  fabLabel: {
    ...typography.caption,
    fontSize:   10.5,
    fontFamily: 'Inter-Bold',
    color:      colors.accent.coral,
  },
  badge: {
    position:         'absolute',
    top:               -6,
    right:             -4,
    minWidth:          18,
    height:            18,
    paddingHorizontal: 4,
    borderRadius:      9,
    backgroundColor:  colors.accent.coral,
    borderWidth:       2,
    borderColor:      colors.bg.primary,
    alignItems:        'center',
    justifyContent:    'center',
  },
  badgeText: {
    ...typography.caption,
    fontSize:   10,
    lineHeight: 12,
    fontFamily: 'Inter-Bold',
    color:      '#fff',
  },
}));

export function TabBarFabItem({ label, icon: Icon, isFocused, pendingCount, onPress }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const glow     = useSharedValue(0);
  const badgePop = useSharedValue(pendingCount > 0 ? 1 : 0);
  const ring     = useSharedValue(isFocused ? 1 : 0);
  // Entrada em mola. O FAB agora acompanha a aba ativa, então este componente
  // monta do zero a cada troca de aba (a aba anterior vira TabBarItem e a nova
  // vira FAB). Sem a entrada, o círculo aparecia "estalado" na posição nova.
  const enter    = useSharedValue(0);

  useEffect(() => {
    enter.value = withSpring(1, { damping: 12, stiffness: 260 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pendingCount > 0) {
      // 🔴 O glow pulsante ANUNCIA pedido pendente. Sob reduce motion ele para
      // aceso (1), nunca apagado: o número no badge continua sendo a
      // informação, e o realce tem de sobreviver ao desligamento do
      // movimento, senão a preferência esconde um aviso.
      glow.value = reducedMotion
        ? withTiming(1, { duration: 200 })
        : withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true);
      if (!reducedMotion) {
        badgePop.value = withSequence(withSpring(1.3, { damping: 6, stiffness: 250 }), withSpring(1, { damping: 8 }));
      }
    } else {
      cancelAnimation(glow);
      glow.value = withTiming(0, { duration: 200 });
      badgePop.value = withTiming(0, { duration: 150 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, pendingCount]);

  useEffect(() => {
    ring.value = withSpring(isFocused ? 1 : 0, { damping: 10, stiffness: 220 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const fabStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.35 + glow.value * 0.25,
    shadowRadius:  16 + glow.value * 10,
    // A escala combina a entrada (0.6→1) com o respiro do glow, para as duas
    // animações não brigarem pela mesma propriedade.
    transform:     [{ scale: (0.6 + enter.value * 0.4) * (1 + glow.value * 0.05) }],
    opacity:       enter.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity:     ring.value,
    borderWidth: 2.5 * ring.value,
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity:   badgePop.value,
    transform: [{ scale: badgePop.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={s.fabWrap}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      hitSlop={8}
    >
      <View style={s.spacer} />

      <Animated.View style={[s.fab, fabStyle]}>
        <Animated.View style={[s.ring, ringStyle]} />
        <LinearGradient
          colors={[colors.accent.coral, '#ff8a5b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.fabFill}
        >
          <Icon size={22} color="#2a0d0d" strokeWidth={2.4} />
        </LinearGradient>
        {pendingCount > 0 && (
          <Animated.View style={[s.badge, badgeStyle]}>
            <Text style={s.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
          </Animated.View>
        )}
      </Animated.View>

      <Text style={s.fabLabel}>{label}</Text>
    </Pressable>
  );
}
