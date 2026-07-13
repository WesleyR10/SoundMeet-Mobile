import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { Check } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const SW = Dimensions.get('window').width; // módulo level — portrait-only, seguro
const NODE_SIZE   = 32;
const NODE_COLORS = [
  colors.brand.primary,   // Identidade
  '#4D9CFF',              // Estilo
  colors.accent.violetLight, // Foto
  colors.accent.coral,    // PIX (mesmo tom de "gorjetas" do design system)
  colors.accent.violet,   // QR Code (reveal premium)
] as const;
const LABELS = ['Identidade', 'Estilo', 'Foto', 'PIX', 'QR Code'] as const;
export const WIZARD_STEP_COUNT = NODE_COLORS.length;

// 5 nós não cabem com o comprimento de linha original (76px, calibrado p/ 3 nós) —
// recalcula o segmento para caber na largura da tela com folga de margem.
const LINE_COUNT  = NODE_COLORS.length - 1;
const LINE_LENGTH = Math.max(
  28,
  Math.floor((SW - NODE_SIZE * NODE_COLORS.length - 48) / LINE_COUNT),
);

type WizardStep = 1 | 2 | 3 | 4 | 5;

type Props = { step: WizardStep };

// Distinto de propósito do AnimatedDot do SlideCarousel (dots simples de conteúdo):
// aqui são N nós conectados por linhas que "desenham" ao completar cada etapa,
// com bounce de mola + check ao concluir — a assinatura visual própria do wizard.
export function WizardProgress({ step }: Props) {
  // Um shared value por nó "não-inicial" (2..N) — index 0 = nó 2, etc.
  const fills   = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const scales  = [useSharedValue(1), useSharedValue(1), useSharedValue(1), useSharedValue(1)];
  const checks  = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const lines   = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  useEffect(() => {
    fills.forEach((fill, i) => {
      const nodeNumber = i + 2; // nós 2..5
      const reached     = step >= nodeNumber;
      fill.value        = withTiming(reached ? 1 : 0, { duration: 260 });
      lines[i].value     = withTiming(reached ? 1 : 0, { duration: 500, easing: Easing.out(Easing.cubic) });
      checks[i].value     = withDelay(150, withTiming(reached ? 1 : 0, { duration: 180 }));
      if (reached) {
        scales[i].value = withSequence(withSpring(1.35, { damping: 6 }), withSpring(1, { damping: 8 }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <View style={s.root}>
      <View style={s.row}>
        <Node style={useAnimatedStyle(() => ({ backgroundColor: NODE_COLORS[0] }))} current={step === 1} label={LABELS[0]} accent={NODE_COLORS[0]} />

        {fills.map((fill, i) => (
          <ProgressLink
            key={i}
            fill={fill}
            scale={scales[i]}
            check={checks[i]}
            line={lines[i]}
            color={NODE_COLORS[i + 1]}
            current={step === i + 2}
            label={LABELS[i + 1]}
          />
        ))}
      </View>
    </View>
  );
}

function ProgressLink({
  fill, scale, check, line, color, current, label,
}: {
  fill:    SharedValue<number>;
  scale:   SharedValue<number>;
  check:   SharedValue<number>;
  line:    SharedValue<number>;
  color:   string;
  current: boolean;
  label:   string;
}) {
  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: LINE_LENGTH * (1 - line.value),
  }));

  const nodeStyle = useAnimatedStyle(() => ({
    backgroundColor: fill.value > 0.5 ? color : 'transparent',
    borderColor:     fill.value > 0.5 ? color : colors.border.default,
    transform:        [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: check.value }] }));

  return (
    <>
      <Svg width={LINE_LENGTH} height={2} style={s.lineGap}>
        <Line x1={0} y1={1} x2={LINE_LENGTH} y2={1} stroke={colors.border.default} strokeWidth={2} />
        <AnimatedLine
          x1={0} y1={1} x2={LINE_LENGTH} y2={1}
          stroke={color} strokeWidth={2}
          strokeDasharray={LINE_LENGTH}
          animatedProps={lineProps}
        />
      </Svg>

      <Node style={nodeStyle} current={current} label={label} accent={color} checkStyle={checkStyle} />
    </>
  );
}

function Node({
  style, current, label, accent, checkStyle,
}: {
  style:       ReturnType<typeof useAnimatedStyle>;
  current:     boolean;
  label:       string;
  accent:      string;
  checkStyle?: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <View style={s.nodeCol}>
      <Animated.View style={[s.node, style, current && { borderColor: accent, shadowColor: accent }, current && s.nodeCurrentShadow]}>
        {checkStyle && (
          <Animated.View style={checkStyle}>
            <Check size={14} color={colors.text.inverse} strokeWidth={3} />
          </Animated.View>
        )}
      </Animated.View>
      <Animated.Text style={[s.labelText, current && { color: colors.text.primary }]}>{label}</Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  lineGap: {
    marginHorizontal: -2,
  },
  nodeCol: {
    alignItems: 'center',
    gap:         spacing.xs,
  },
  node: {
    width:          NODE_SIZE,
    height:         NODE_SIZE,
    borderRadius:   NODE_SIZE / 2,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  nodeCurrentShadow: {
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius:  10,
    elevation:      4,
  },
  labelText: {
    ...typography.caption,
    color:          colors.text.muted,
    textTransform:  'uppercase',
    letterSpacing:  0.6,
  },
});
