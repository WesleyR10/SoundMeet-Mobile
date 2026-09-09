import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, Lock } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  title:        string;
  subtitle?:    string;
  icon?:        LucideIcon;
  accentColor?: string;
  isComplete?:  boolean;
  // Feature paga não liberada pro plano atual (ex.: QR Code customizado,
  // PRO only) — troca o chevron animado por um cadeado estático. A seção
  // continua abrindo/fechando normalmente; quem decide o que renderizar
  // dentro (texto informativo vs. inputs) é o conteúdo (children), não este
  // componente — ver EditQRCodeSection.tsx.
  locked?:      boolean;
  isOpen:       boolean;
  onToggle:     () => void;
  children:     ReactNode;
};

// Totalmente controlado (isOpen/onToggle vêm de fora) — mesmo espírito de
// WizardProgress.tsx (recebe `step`, não guarda estado próprio de qual nó está
// ativo). Quem decide single-open vs. multi-open é o consumidor (EditProfileScreen
// guarda `openId` e decide), o componente não embute essa política.
//
// Altura animada via onLayout: o conteúdo fica sempre montado (nunca `isOpen &&
// <>...</>`) para medir a altura natural uma vez; o wrapper externo com
// overflow:hidden anima entre 0 e essa altura. Evita o "flash" de calcular
// altura só depois de abrir.
//
// Linguagem visual "premium" emprestada de componentes já existentes no app
// (não é enfeite novo, é o mesmo idioma): borda + glow que intensificam ao
// abrir (mesma ideia de WizardProgress — nó ganha cor/shadow ao ser alcançado),
// pop de mola no ícone (mesmo `withSequence(withSpring...)` do QRActionRow/
// WizardProgress) e um fio de gradiente no topo do card quando aberto.
const useStyles = makeStyles((colors) => ({
  card: {
    borderRadius:    radius.lg,
    borderWidth:      1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow:        'hidden',
  },
  topGlow: {
    position: 'absolute',
    top:       0,
    left:      0,
    right:     0,
    height:    2,
  },
  topGlowFill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    minHeight:      56,
    padding:        spacing.md,
  },
  iconBox: {
    width:          34,
    height:         34,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap:   2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  title: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.primary,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: radius.full,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  body: {
    overflow: 'hidden',
  },
  bodyInner: {
    position:          'absolute',
    left:               0,
    right:              0,
    paddingHorizontal: spacing.md,
    paddingBottom:      spacing.lg,
    gap:                 spacing.lg,
  },
}));

export function AccordionSection({
  title, subtitle, icon: Icon, accentColor,
  isComplete = false, locked = false, isOpen, onToggle, children,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  /*
   * 🔴 O default saiu da ASSINATURA de propósito. `accentColor =
   * colors.brand.primary` no parâmetro é avaliado fora do corpo do componente,
   * onde o `colors` do tema não existe — e, quando existia como constante de
   * módulo, congelava a paleta dark no carregamento.
   */
  const accent = accentColor ?? colors.brand.primary;
  const [contentHeight, setContentHeight] = useState(0);
  const progress   = useSharedValue(isOpen ? 1 : 0);
  const chevron     = useSharedValue(isOpen ? 1 : 0);
  const iconScale   = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) });
    chevron.value   = withTiming(isOpen ? 1 : 0, { duration: 300 });
    if (isOpen) {
      iconScale.value = withSequence(withSpring(1.16, { damping: 6, stiffness: 200 }), withSpring(1, { damping: 8 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sem shadow/elevation animados aqui: o card tem overflow:hidden (necessário
  // pro fio de gradiente do topo e pro clip do body colapsado), e shadow/elevation
  // precisam desenhar FORA dos limites da view — com overflow:hidden a sombra
  // fica cortada/mal-formada (vira um artefato feio de "sombra interna" em vez
  // de glow externo). Só a borda intensifica ao abrir.
  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [`${accent}40`, accent]),
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const iconBoxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [`${accent}18`, `${accent}30`]),
    transform:        [{ scale: iconScale.value }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    height:    contentHeight * progress.value,
    opacity:   progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  return (
    <Animated.View style={[s.card, cardStyle]}>
      <Animated.View style={[s.topGlow, gradientStyle]}>
        <LinearGradient
          colors={['transparent', accent, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.topGlowFill}
        />
      </Animated.View>

      <Pressable
        onPress={onToggle}
        style={s.header}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isOpen }}
        hitSlop={4}
      >
        {Icon && (
          <Animated.View style={[s.iconBox, iconBoxStyle]}>
            <Icon size={18} color={accent} strokeWidth={2.2} />
          </Animated.View>
        )}

        <View style={s.headerText}>
          <View style={s.titleRow}>
            <Text style={s.title}>{title}</Text>
            <View style={[s.dot, isComplete ? { backgroundColor: accent } : { borderWidth: 1.5, borderColor: `${accent}66` }]} />
          </View>
          {!!subtitle && !isOpen && (
            <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>

        {locked ? (
          <Lock size={18} color={colors.text.secondary} />
        ) : (
          <Animated.View style={chevronStyle}>
            <ChevronDown size={20} color={colors.text.secondary} />
          </Animated.View>
        )}
      </Pressable>

      <Animated.View style={[s.body, bodyStyle]}>
        <View
          style={s.bodyInner}
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
        >
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
