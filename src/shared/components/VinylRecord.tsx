import { useEffect, useMemo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/hooks/useTheme';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { grooveRadii, sheenSlices } from '@/shared/utils/vinyl-geometry';

type Props = {
  /** Diâmetro do SELO (a foto). O disco em volta é proporcional. */
  labelSize: number;
  /** Enquanto `true`, o selo gira — é o "tocando" do produto. */
  spinning?: boolean;
  /** Arrastando uma foto por cima / disco em foco: acende na cor da marca. */
  highlighted?: boolean;
  /** O conteúdo do selo — a foto, ou o ícone quando não há. */
  children: ReactNode;
};

/** O selo ocupa 72% do disco, como no `.sm-avatar-stage` do painel web. */
const LABEL_RATIO = 0.72;

/**
 * O disco de vinil com o selo no centro — o mesmo objeto do editor de foto do
 * painel web (`EstablishmentAvatarEditor`), para as duas pontas do produto
 * falarem a mesma língua.
 *
 * ## Quem gira é o SELO, não o reflexo
 *
 * Sulco é concêntrico: girá-lo seria invisível. O que denuncia rotação é o selo
 * — a foto. E a luz que bate no disco fica parada em relação à sala enquanto
 * ele gira; se o brilho girasse junto, o olho leria "imagem rodando", não
 * "disco tocando". Mesma regra do `.sm-vinyl` do web.
 *
 * O disco é escuro nos DOIS temas: vinil é preto. No tema claro a base vira o
 * texto primário (verde quase preto), exatamente como no CSS.
 *
 * Sob "reduzir movimento" o selo não gira — o eixo aparece, e é ele que diz
 * "enviando" sem movimento nenhum.
 */
export function VinylRecord({ labelSize, spinning = false, highlighted = false, children }: Props) {
  const { colors, isDark } = useTheme();
  const reduced = useReducedMotion();

  const disc = Math.round(labelSize / LABEL_RATIO);
  const center = disc / 2;
  const base = isDark ? colors.bg.primary : colors.text.primary;

  const grooves = useMemo(() => grooveRadii(center, labelSize / 2 + 6), [center, labelSize]);
  const sheen = useMemo(
    () => [
      // Os dois brilhos do `conic-gradient(from 24deg, …)` do web.
      ...sheenSlices(center, center, center, 54, 74, 96, 0.12),
      ...sheenSlices(center, center, center, 230, 252, 276, 0.07),
    ],
    [center],
  );

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (spinning && !reduced) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 1800, easing: Easing.linear }),
        -1,
        false,
      );
      return;
    }
    cancelAnimation(rotation);
    /*
     * Termina a volta PARA A FRENTE e só então zera. Voltar direto a 0 faria o
     * selo girar ao contrário por meio segundo — um disco não faz isso. Como
     * 360° e 0° são a mesma posição, o zero no fim é invisível.
     */
    const target = Math.ceil(rotation.value / 360) * 360;
    rotation.value = withTiming(target, { duration: 520, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) rotation.value = 0;
    });
  }, [spinning, reduced, rotation]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      style={[
        s.disc,
        {
          width:           disc,
          height:          disc,
          borderRadius:    disc / 2,
          backgroundColor: base,
          borderColor:     highlighted ? colors.brand.primary : 'rgba(255,255,255,0.07)',
          borderWidth:     highlighted ? 2 : 1,
        },
      ]}
    >
      <Svg width={disc} height={disc} style={StyleSheet.absoluteFill} pointerEvents="none">
        {grooves.map((r) => (
          <Circle key={r} cx={center} cy={center} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth={1} fill="none" />
        ))}
      </Svg>

      <Animated.View
        style={[
          s.label,
          {
            width:        labelSize,
            height:       labelSize,
            borderRadius: labelSize / 2,
            borderColor:  colors.brand.primary,
          },
          labelStyle,
        ]}
      >
        {children}
        {/* O eixo do toca-discos — só aparece enquanto gira. */}
        {spinning && (
          <View style={[s.spindle, { backgroundColor: base, borderColor: 'rgba(255,255,255,0.35)' }]} />
        )}
      </Animated.View>

      {/* O reflexo, PARADO em relação à sala — por cima de tudo, sem tocar no toque. */}
      <Svg width={disc} height={disc} style={StyleSheet.absoluteFill} pointerEvents="none">
        {sheen.map((slice, index) => (
          // Branco nos dois temas de propósito: é LUZ batendo no vinil, não cor
          // de interface — o mesmo `rgb(255 255 255 / x)` do CSS do web.
          <Path key={index} d={slice.path} fill="rgb(255,255,255)" fillOpacity={slice.opacity} />
        ))}
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  disc: {
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  label: {
    overflow:    'hidden',
    borderWidth: 2,
    alignItems:  'center',
    justifyContent: 'center',
  },
  spindle: {
    position:     'absolute',
    width:        10,
    height:       10,
    borderRadius: 5,
    borderWidth:  2,
  },
});
