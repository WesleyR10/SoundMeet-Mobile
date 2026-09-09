import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Download, X } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { CelebrationBurst } from '@/shared/components/CelebrationBurst';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { shareImageAsync, saveImageToGalleryAsync } from '@/shared/services/media/imageShare';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { registerSocialShare } from '../../infrastructure/social-share.api';
import type { CelebrationPayload } from '../../domain/boost-notifications.types';
import { TipReceiptCard, type TipReceiptCardHandle } from './TipReceiptCard';

type Props = {
  payload: CelebrationPayload;
  musicianName: string | null;
  fanName: string | null;
  onDismiss: () => void;
};

/**
 * A comemoração de gorjeta confirmada.
 *
 * ## As cinco fases
 *
 * | fase | ms        | o que acontece                                       |
 * |------|-----------|------------------------------------------------------|
 * | 1    | 0–400     | fundo escurece, bloom radial coral→magenta abre        |
 * | 2    | 300–2100  | 56 partículas com gravidade                            |
 * | 3    | 500–1400  | valor entra com mola e overshoot                       |
 * | 4    | 900–1700  | o recibo se monta                                      |
 * | 5    | 1400–2400 | dedicatória revela, haptic de sucesso                  |
 *
 * ## Reduce motion não é variação, é caminho próprio
 *
 * 🔴 Com "reduzir movimento" ligado, o overlay vai DIRETO ao estado final: sem
 * bloom, sem partículas, sem mola. Uma versão "mais lenta" da mesma animação
 * continuaria provocando o mesmo desconforto — o que a preferência pede é a
 * ausência do movimento, não a sua atenuação. Este é o primeiro tratamento de
 * reduce-motion do app; ver `useReducedMotion`.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,6,12,0.94)',
  },
  bloomWrap: {
    position:  'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloom: { width: '100%', height: '100%' },
  close: {
    position: 'absolute',
    top:       spacing.xxl,
    right:     spacing.xl,
    zIndex:    10,
  },
  content: {
    alignItems:        'center',
    paddingHorizontal:  spacing.xl,
    gap:                spacing.md,
  },
  eyebrow: {
    ...typography.caption,
    color:         colors.accent.coral,
    letterSpacing: 1.4,
    textAlign:     'center',
  },
  amount: {
    ...typography.displayLg,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  cardWrap: { marginTop: spacing.md },
  dedicationEcho: {
    ...typography.bodySm,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  toggle: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    marginTop:      spacing.sm,
    minHeight:      44,
  },
  toggleBox: {
    width:           20,
    height:          20,
    borderRadius:    radius.sm,
    borderWidth:     1.5,
    borderColor:     colors.border.strong,
  },
  toggleBoxOn: {
    backgroundColor: colors.accent.coral,
    borderColor:     colors.accent.coral,
  },
  toggleLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    marginTop:      spacing.sm,
  },
  action: { minWidth: 190 },
  secondary: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    paddingHorizontal:  spacing.md,
    minHeight:          48,
  },
  secondaryLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
}));

export function TipCelebrationOverlay({ payload, musicianName, fanName, onDismiss }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<TipReceiptCardHandle>(null);
  const audienceId = useAuthStore((state) => state.user?.audienceId ?? null);

  const [showAmount, setShowAmount] = useState(false);
  const [busy, setBusy] = useState(false);

  const bloom   = useSharedValue(0);
  const amount  = useSharedValue(0);
  const card    = useSharedValue(0);
  const dedication = useSharedValue(0);
  const [burstOn, setBurstOn] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      bloom.value = 1;
      amount.value = 1;
      card.value = 1;
      dedication.value = 1;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    bloom.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    setBurstOn(true);

    amount.value = withDelay(500, withSpring(1, { damping: 9, stiffness: 130 }));
    card.value   = withDelay(900, withSpring(1, { damping: 15, stiffness: 120 }));
    dedication.value = withDelay(
      1_400,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) runOnJS(successHaptic)();
      }),
    );
  }, [reducedMotion, bloom, amount, card, dedication]);

  const bloomStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(bloom.value, [0, 1], [0, 0.55]),
    transform: [{ scale: interpolate(bloom.value, [0, 1], [0.2, 1]) }],
  }));

  const amountStyle = useAnimatedStyle(() => ({
    opacity:   amount.value,
    transform: [{ scale: interpolate(amount.value, [0, 1], [0.5, 1]) }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity:   card.value,
    transform: [
      { translateY: interpolate(card.value, [0, 1], [40, 0]) },
      { scale: interpolate(card.value, [0, 1], [0.92, 1]) },
    ],
  }));

  const dedicationStyle = useAnimatedStyle(() => ({
    opacity:   dedication.value,
    transform: [{ translateY: interpolate(dedication.value, [0, 1], [10, 0]) }],
  }));

  async function handleShare() {
    setBusy(true);
    try {
      const uri = await cardRef.current?.capture();
      if (!uri) return;

      await shareImageAsync(uri, { dialogTitle: 'Compartilhar recibo' });

      /*
       * 🔴 O registro NÃO afirma que o post aconteceu — o SO não conta ao app
       * se o usuário compartilhou ou cancelou (`imageShare.ts` documenta isso).
       * Por isso o backend credita pouco e credita UMA VEZ por recibo,
       * deduplicando por (content_type, content_id) contra o ledger.
       *
       * `platform` fica de fora de propósito: o share sheet não informa o
       * destino, e inventar "instagram" seria gravar dado falso num relatório.
       *
       * Falha aqui não vira erro na tela: a celebração é do usuário, e uma
       * falha de gamificação não pode estragá-la.
       */
      if (audienceId) {
        try {
          await registerSocialShare({
            audienceId,
            contentType: 'tip_receipt',
            contentId:   payload.tip_id,
          });
        } catch {
          // silencioso de propósito — ver acima
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      const uri = await cardRef.current?.capture();
      if (uri) await saveImageToGalleryAsync(uri, { subject: 'o recibo da sua gorjeta' });
    } finally {
      setBusy(false);
    }
  }

  const bloomSize = width * 1.8;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={s.root}>
        <Animated.View style={[s.bloomWrap, { width: bloomSize, height: bloomSize }, bloomStyle]}>
          <LinearGradient
            colors={[colors.accent.coral, colors.accent.coralDeep, 'transparent']}
            style={[s.bloom, { borderRadius: bloomSize / 2 }]}
          />
        </Animated.View>

        <Pressable style={s.close} onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fechar">
          <X size={22} color={colors.text.secondary} />
        </Pressable>

        <View style={s.content}>
          <Animated.View style={amountStyle}>
            <Text style={s.eyebrow}>GORJETA CONFIRMADA</Text>
            <Text style={s.amount}>
              R$ {payload.amount.toFixed(2).replace('.', ',')}
            </Text>
          </Animated.View>

          <Animated.View style={[s.cardWrap, cardStyle]}>
            <TipReceiptCard
              ref={cardRef}
              amount={payload.amount}
              songTitle={payload.song_title}
              dedication={payload.dedication}
              musicianName={musicianName}
              fanName={fanName}
              showAmount={showAmount}
            />
          </Animated.View>

          {!!payload.dedication && (
            <Animated.Text style={[s.dedicationEcho, dedicationStyle]} numberOfLines={2}>
              sua dedicatória já está no palco
            </Animated.Text>
          )}

          {/*
            🔴 Opt-in, desligado por padrão — ver a nota no `TipReceiptCard`.
          */}
          <Pressable
            style={s.toggle}
            onPress={() => setShowAmount((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: showAmount }}
          >
            <View style={[s.toggleBox, showAmount && s.toggleBoxOn]} />
            <Text style={s.toggleLabel}>Mostrar o valor no card</Text>
          </Pressable>

          <View style={s.actions}>
            <PrimaryButton
              label="Compartilhar"
              variant="coral"
              onPress={handleShare}
              loading={busy}
              style={s.action}
            />
            <Pressable
              style={s.secondary}
              onPress={handleSave}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Salvar o recibo na galeria"
              accessibilityState={{ disabled: busy }}
            >
              <Download size={16} color={colors.text.secondary} />
              <Text style={s.secondaryLabel}>Salvar</Text>
            </Pressable>
          </View>
        </View>

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <CelebrationBurst trigger={burstOn} disabled={reducedMotion} />
        </View>
      </View>
    </Modal>
  );
}

function successHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
