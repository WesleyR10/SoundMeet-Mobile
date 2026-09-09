import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { radius, spacing } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

type Props = {
  width?: DimensionValue;
  height?: number;
  /** Default `radius.sm`; use `radius.full` para avatares. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

const PULSE_MS = 1100;

/**
 * Bloco de carregamento.
 *
 * ## Por que isto existe
 *
 * O app tinha **38 telas** com `ActivityIndicator` de tela cheia: o spinner
 * substituía o conteúdo inteiro, sem nenhuma estrutura, e a chegada dos dados
 * provocava um salto de layout. O `soundmeet-web` já não faz isso (20
 * `loading.tsx` + `skeleton.tsx`) — a assimetria pesava justamente no lado onde
 * a rede é pior.
 *
 * ## Pulso de opacidade, não varredura de gradiente
 *
 * A varredura (shimmer) exigiria `expo-linear-gradient` animado por bloco, e
 * numa lista de 6 cards são 6 gradientes animando ao mesmo tempo. O pulso é uma
 * `opacity` só, roda na thread de UI e comunica a mesma coisa: "isto ainda vai
 * mudar".
 *
 * 🔴 **`prefers-reduced-motion` desliga o pulso**, não o encurta. O bloco fica
 * estático na opacidade média — a preferência pede ausência de movimento, e
 * uma versão atenuada continuaria pulsando na periferia da visão. Mesma decisão
 * já registrada no `TipCelebrationOverlay`.
 */
const useStyles = makeStyles((colors) => ({
  block: {
    backgroundColor: colors.bg.elevated,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.lg,
  },
  cardBody: {
    flex: 1,
    gap: spacing.sm,
  },
  header: {
    gap: spacing.md,
  },
  headerCentered: {
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: spacing.sm,
  },
  headerTextCentered: {
    flex: 0,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
  },
  paragraph: {
    gap: spacing.sm,
  },
}));

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: Props) {
  const s = useStyles();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0.5;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reducedMotion, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.9]),
  }));

  return (
    <Animated.View
      style={[s.block, { width, height, borderRadius }, animatedStyle, style]}
      // O leitor de tela não deve anunciar bloco de placeholder — quem anuncia
      // o carregamento é a tela, com `accessibilityLabel` no container.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

type ListProps = {
  /** Quantos cards fantasma. Default 4 — cabe na dobra sem prometer demais. */
  count?: number;
  /** Altura de cada card. Ajuste ao card real da tela. */
  itemHeight?: number;
  /** Mostra um círculo de avatar à esquerda, como nas listas com foto. */
  withAvatar?: boolean;
};

/**
 * Lista fantasma — a forma dominante do app (`FlatList` de `GlowCard`).
 *
 * ⚠️ **`itemHeight` deve bater com o card real da tela.** Um esqueleto com
 * altura genérica devolve o salto de layout que ele existe para eliminar; é
 * pior que o spinner, porque promete uma forma e entrega outra.
 */
export function SkeletonList({ count = 4, itemHeight = 92, withAvatar = false }: ListProps) {
  const s = useStyles();
  return (
    <View
      style={s.list}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[s.card, { minHeight: itemHeight }]}>
          {withAvatar && <Skeleton width={44} height={44} borderRadius={radius.full} />}
          <View style={s.cardBody}>
            {/*
              Larguras diferentes por linha, e decrescentes: um bloco cheio em
              todas as linhas lê como caixa vazia, não como texto por vir.
            */}
            <Skeleton width="65%" height={15} />
            <Skeleton width="90%" height={12} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

type HeaderProps = {
  /** Diâmetro do avatar. Bata com o `<Avatar size>` da tela. */
  avatarSize?: number;
  /** Centralizado (perfil/hero) ou alinhado à esquerda (linha de lista). */
  centered?: boolean;
};

/**
 * Cabeçalho de perfil fantasma — avatar + nome + subtítulo.
 *
 * Cobre a forma que se repete em perfil do músico, perfil do fã, detalhe de
 * banda e detalhe de estabelecimento. É por isso que **não** existe um esqueleto
 * sob medida por tela de detalhe: 17 arquivos quase iguais divergiriam no
 * primeiro ajuste de espaçamento.
 */
export function SkeletonProfileHeader({ avatarSize = 88, centered = true }: HeaderProps) {
  const s = useStyles();
  return (
    <View style={[s.header, centered ? s.headerCentered : s.headerRow]}>
      <Skeleton width={avatarSize} height={avatarSize} borderRadius={radius.full} />
      <View style={[s.headerText, centered && s.headerTextCentered]}>
        <Skeleton width={centered ? 180 : '55%'} height={22} />
        <Skeleton width={centered ? 120 : '35%'} height={14} />
      </View>
    </View>
  );
}

/**
 * Faixa de métricas — os cartões lado a lado de estatística, KPI ou pontuação.
 *
 * ⚠️ `count` deve bater com o número real de métricas da tela. Três fantasmas
 * virando duas métricas é o mesmo salto de layout que o esqueleto existe para
 * evitar.
 */
export function SkeletonStatRow({ count = 3, height = 76 }: { count?: number; height?: number }) {
  const s = useStyles();
  return (
    <View style={s.statRow}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} borderRadius={radius.lg} style={s.statItem} />
      ))}
    </View>
  );
}

/**
 * Parágrafo fantasma — documento, cifra, bio.
 *
 * A última linha sai mais curta de propósito: é o que a vista reconhece como
 * "texto" em vez de "bloco".
 */
export function SkeletonText({ lines = 3, lineHeight = 13 }: { lines?: number; lineHeight?: number }) {
  const s = useStyles();
  return (
    <View style={s.paragraph}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '55%' : '100%'}
          height={lineHeight}
        />
      ))}
    </View>
  );
}

