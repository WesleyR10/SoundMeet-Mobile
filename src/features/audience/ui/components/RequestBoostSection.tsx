import { useEffect, useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowUp, Gift } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography, gradients, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { FormField } from '@/shared/components/FormField';
import { TravelingBorderGlow } from '@/shared/components/TravelingBorderGlow';
import { TipAmountSelector } from './TipAmountSelector';

// Piso do backend (`REQUEST_BOOST_MIN_AMOUNT`, default R$2). Duplicado aqui de
// propósito, para desabilitar o botão antes do 422 — a fonte da verdade
// continua sendo a policy do servidor.
export const BOOST_MIN_AMOUNT = 2;
const BOOST_PRESETS = [2, 5, 10, 20] as const;
const DEDICATION_MAX = 140;

type Props = {
  amount:     number | null;
  onAmountChange: (value: number | null) => void;
  dedication: string;
  onDedicationChange: (value: string) => void;
  // Nome artístico, quando a tela já o conhece. Ausente vira "O artista" — a
  // ressalva é obrigatória e não pode depender de um fetch a mais.
  musicianName?: string | null;
  songTitle:  string;
  artistName: string;
};

/**
 * Destaque pago do pedido — a gorjeta acoplada ao momento em que o fã pede.
 *
 * ## O que a copy pode e não pode prometer
 *
 * 🔴 "Destaca seu pedido no topo da fila". **Nunca** "garante que vai tocar":
 * o músico continua livre para recusar, e prometer execução seria vender o que
 * a plataforma não controla — a primeira recusa de um pedido de R$20 viraria
 * reclamação legítima.
 *
 * ## Por que o preview existe
 *
 * O fã está comprando posição numa fila que ele não enxerga. O card mostra
 * exatamente como o pedido vai aparecer para o músico, incluindo a
 * dedicatória — é o que transforma um campo de valor abstrato em algo que se
 * entende sem explicação.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    gap:              spacing.md,
    padding:          spacing.lg,
    borderRadius:     radius.lg,
    borderWidth:      1,
    borderColor:      `${colors.accent.coral}33`,
    backgroundColor:  `${colors.accent.coral}0A`,
  },
  header: {
    flexDirection: 'row',
    gap:            spacing.md,
    alignItems:    'flex-start',
  },
  headerIcon: {
    width:           32,
    height:          32,
    borderRadius:    radius.full,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: `${colors.accent.coral}1F`,
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    ...typography.title,
    fontSize: 17,
    color:    colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  counter: {
    ...typography.caption,
    color:     colors.text.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  previewLabel: {
    ...typography.caption,
    color:         colors.text.muted,
    letterSpacing: 0.6,
    marginTop:     spacing.lg,
    marginBottom:  spacing.sm,
    textTransform: 'uppercase',
  },
  previewWrap: {
    borderRadius:    radius.lg,
    backgroundColor: colors.bg.elevated,
    overflow:        'hidden',
    ...shadows.coral,
  },
  previewBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    paddingVertical:    spacing.sm,
    paddingHorizontal:  spacing.md,
  },
  previewBadgeText: {
    ...typography.caption,
    color:         '#FFFFFF',
    letterSpacing: 0.8,
  },
  previewBody: {
    padding: spacing.md,
    gap:      2,
  },
  previewSong: {
    ...typography.title,
    fontSize: 16,
    color:    colors.text.primary,
  },
  previewArtist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  previewDedication: {
    flexDirection: 'row',
    gap:            spacing.xs,
    alignItems:    'flex-start',
    marginTop:      spacing.sm,
    paddingTop:     spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  previewDedicationText: {
    ...typography.bodySm,
    flex:      1,
    color:     colors.text.primary,
    fontStyle: 'italic',
  },
  disclaimer: {
    ...typography.caption,
    color:     colors.text.muted,
    marginTop: spacing.md,
    lineHeight: 15,
  },
}));

export function RequestBoostSection({
  amount,
  onAmountChange,
  dedication,
  onDedicationChange,
  musicianName,
  songTitle,
  artistName,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const reveal = useSharedValue(0);

  const hasAmount = amount !== null && amount >= BOOST_MIN_AMOUNT;

  useEffect(() => {
    reveal.value = withSpring(hasAmount ? 1 : 0, { damping: 16, stiffness: 140 });
    if (hasAmount) Haptics.selectionAsync();
  }, [hasAmount, reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity:   reveal.value,
    transform: [{ translateY: interpolate(reveal.value, [0, 1], [-12, 0]) }],
    // `display` evita que a seção oculta continue capturando toque quando
    // recolhida — `opacity: 0` sozinho deixaria o campo acessível ao teclado.
    display:   reveal.value === 0 ? 'none' : 'flex',
  }));

  function handlePreviewLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setPreviewSize({ width, height });
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Sparkles size={16} color={colors.accent.coral} />
        </View>
        <View style={s.headerText}>
          <Text style={s.title}>Destacar meu pedido</Text>
          <Text style={s.subtitle}>
            Sobe pro topo da fila do artista. Você só paga se ele aceitar.
          </Text>
        </View>
      </View>

      <TipAmountSelector
        value={amount}
        onChange={onAmountChange}
        presets={BOOST_PRESETS}
        minimum={BOOST_MIN_AMOUNT}
        placeholder={`Mín. R$ ${BOOST_MIN_AMOUNT}`}
      />

      <Animated.View style={revealStyle}>
        <FormField
          label="Dedicatória (opcional)"
          value={dedication}
          onChangeText={(text) => onDedicationChange(text.slice(0, DEDICATION_MAX))}
          placeholder="Essa é pra minha esposa, Ana 💚"
          autoCapitalize="sentences"
          multiline
        />
        <Text style={s.counter}>
          {dedication.length}/{DEDICATION_MAX}
        </Text>

        <Text style={s.previewLabel}>Como o artista vai ver</Text>

        <View style={s.previewWrap} onLayout={handlePreviewLayout}>
          <LinearGradient
            colors={gradients.energy}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.previewBadge}
          >
            <ArrowUp size={13} color="#FFFFFF" />
            <Text style={s.previewBadgeText}>
              DESTAQUE · R$ {(amount ?? 0).toFixed(2).replace('.', ',')}
            </Text>
          </LinearGradient>

          <View style={s.previewBody}>
            <Text style={s.previewSong} numberOfLines={1}>
              {songTitle.trim() || 'Sua música'}
            </Text>
            <Text style={s.previewArtist} numberOfLines={1}>
              {artistName.trim() || 'Artista'}
            </Text>

            {dedication.trim().length > 0 && (
              <View style={s.previewDedication}>
                <Gift size={13} color={colors.accent.coral} />
                <Text style={s.previewDedicationText} numberOfLines={2}>
                  {dedication.trim()}
                </Text>
              </View>
            )}
          </View>

          {previewSize.width > 0 && (
            <TravelingBorderGlow
              width={previewSize.width}
              height={previewSize.height}
              radius={radius.lg}
              color={colors.accent.coral}
              active={hasAmount}
            />
          )}
        </View>

        {/*
          🔴 A ressalva NÃO é opcional e nunca depende de dado carregado: sem
          ela, "destaque" lido como "garantia" transforma a primeira recusa de
          um pedido de R$20 em reclamação legítima.
        */}
        <Text style={s.disclaimer}>
          {musicianName?.trim() || 'O artista'} continua livre pra aceitar ou
          recusar — o destaque coloca você na frente da fila, não garante a
          música.
        </Text>
      </Animated.View>
    </View>
  );
}
