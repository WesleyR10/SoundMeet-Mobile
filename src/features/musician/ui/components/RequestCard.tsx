import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Check, X, Clock, ArrowUp, Gift, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography, shadows, gradients } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SwipeRevealBackground } from './SwipeRevealBackground';
import { boostStatusLabel, isBoostVisible } from '../../domain/request-boost.rules';
import type { MusicRequest } from '../../domain/request.types';

type Props = {
  request:  MusicRequest;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
  // true quando a última tentativa de accept/reject DESTE pedido falhou —
  // desfaz a animação otimista de saída (o pedido continua pendente de
  // verdade, então a UI precisa refletir isso, não só o toque do usuário).
  failed?: boolean;
  // Motivo devolvido pelo backend quando este pedido falhou dentro de um lote
  // (`BatchRespondFailure.reason`). Mostrado no próprio card: num lote de 30,
  // "3 falharam" num toast não diz ao músico QUAIS nem POR QUÊ.
  failureReason?: string | null;

  // --- Seleção múltipla (responder em lote) ---
  // Quando `selectable`, o card troca de idioma de interação: o swipe é
  // desligado (arrastar deixaria a seleção e a ação em disputa pelo mesmo
  // gesto) e o toque passa a marcar/desmarcar em vez de responder.
  selectable?:     boolean;
  selected?:       boolean;
  onToggleSelect?: () => void;
  // Long-press entra em modo seleção — padrão nativo das duas plataformas.
  onLongPress?:    () => void;
};

const SWIPE_THRESHOLD = 96;
const SWIPE_VELOCITY   = 800;

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// Primeiro card de lista com swipe do app — segue o mesmo idioma de gesto já
// provado em SlideCarousel.tsx (Gesture.Pan + threshold/velocity + runOnJS +
// snap-back), adaptado pra accept/reject de item de lista. Botões de toque
// explícitos sempre visíveis — não é swipe-only (acessibilidade + regra do
// CLAUDE.md de 48x48 mínimo).
const useStyles = makeStyles((colors) => ({
  root: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor:   colors.bg.surface,
    borderRadius:      radius.lg,
    borderWidth:       1,
    borderColor:       colors.border.default,
    padding:           spacing.lg,
    gap:               spacing.xs,
    ...shadows.sm,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardSelected: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
  },
  cardFailed: {
    borderColor: colors.status.error,
  },
  selectDot: {
    width:          24,
    height:         24,
    borderRadius:   radius.full,
    borderWidth:    2,
    borderColor:    colors.border.default,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    spacing.sm,
  },
  selectDotOn: {
    backgroundColor: colors.brand.primary,
    borderColor:     colors.brand.primary,
  },
  failureRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:             spacing.xs,
    marginTop:       spacing.sm,
    paddingTop:      spacing.sm,
    borderTopWidth:  1,
    borderTopColor:  colors.border.default,
  },
  failureText: {
    ...typography.caption,
    flex:  1,
    color: colors.status.error,
  },
  cardBoosted: {
    borderColor: `${colors.accent.coral}55`,
    ...shadows.coral,
  },
  boostStrip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    alignSelf:         'flex-start',
    paddingVertical:    4,
    paddingHorizontal:  spacing.sm,
    borderRadius:       radius.full,
    marginBottom:       spacing.xs,
  },
  boostAmount: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
    color:      '#FFFFFF',
  },
  boostStatus: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  dedication: {
    flexDirection:  'row',
    gap:             spacing.xs,
    alignItems:     'flex-start',
    marginTop:       spacing.xs,
    paddingTop:      spacing.sm,
    borderTopWidth:  1,
    borderTopColor:  colors.border.default,
  },
  dedicationText: {
    ...typography.bodySm,
    flex:      1,
    color:     colors.text.primary,
    fontStyle: 'italic',
  },
  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:             spacing.sm,
  },
  songTitle: {
    ...typography.title,
    color: colors.text.primary,
    flex:  1,
  },
  urgentBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    borderRadius:      radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    backgroundColor:  `${colors.status.error}1F`,
  },
  urgentText: {
    ...typography.caption,
    color: colors.status.error,
  },
  artist: {
    ...typography.liveBody,
    color: colors.text.secondary,
  },
  message: {
    ...typography.liveBody,
    color:      colors.text.muted,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap:            spacing.md,
    marginTop:      spacing.sm,
  },
  rejectBtn: {
    width:           48,
    height:          48,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.accent.coral,
    alignItems:      'center',
    justifyContent:  'center',
  },
  acceptBtn: {
    flex:              1,
    height:            48,
    borderRadius:      radius.md,
    backgroundColor:  colors.brand.primary,
    alignItems:        'center',
    justifyContent:    'center',
    ...shadows.brand,
  },
}));

export function RequestCard({
  request,
  onAccept,
  onReject,
  disabled,
  failed,
  failureReason,
  selectable,
  selected,
  onToggleSelect,
  onLongPress,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  // `isBoostVisible` (e não o status cru): `expired` e `cancelled` são pedidos
  // comuns e não podem exibir o selo. A regra mora no domínio porque é sobre
  // dinheiro — ver `request-boost.rules.ts`.
  const boost = isBoostVisible(request.boost) ? request.boost : null;
  const translateX = useSharedValue(0);
  const hapticFired = useSharedValue(false);

  // Mutation falhou pra este pedido (accept/reject não confirmado pelo
  // backend) — desfaz a animação de saída otimista disparada em onEnd, o
  // card volta a aparecer na lista em vez de ficar "sumido" fora da tela
  // enquanto o pedido continua pendente de verdade.
  useEffect(() => {
    if (failed) {
      translateX.value = withTiming(0, { duration: 250 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  // Entrar em modo seleção com um swipe pela metade deixaria o card torto e
  // com o fundo de accept/reject à mostra — estado que não corresponde mais a
  // nenhuma ação possível, já que o pan acabou de ser desligado.
  useEffect(() => {
    if (selectable) {
      translateX.value = withTiming(0, { duration: 150 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectable]);

  const pan = Gesture.Pan()
    .enabled(!disabled && !selectable)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      const crossed = Math.abs(e.translationX) > SWIPE_THRESHOLD;
      if (crossed && !hapticFired.value) {
        hapticFired.value = true;
        runOnJS(triggerHaptic)();
      } else if (!crossed && hapticFired.value) {
        hapticFired.value = false;
      }
    })
    .onEnd((e) => {
      const tx = e.translationX;
      const vx = e.velocityX;
      // Velocidade só conta como sinal de "flick" quando concorda com o
      // sinal do deslocamento total — sem isso, um flick de reversão rápida
      // no fim do gesto (ex.: arrastou pra esquerda, corrigiu rápido pra
      // direita sem soltar) podia disparar a ação oposta à que o card
      // estava mostrando visualmente (fundo revelado) no momento da soltura.
      const isAccept = tx > SWIPE_THRESHOLD || (vx > SWIPE_VELOCITY && tx >= 0);
      const isReject = tx < -SWIPE_THRESHOLD || (vx < -SWIPE_VELOCITY && tx <= 0);

      if (isAccept) {
        translateX.value = withTiming(500, { duration: 200 });
        runOnJS(onAccept)();
      } else if (isReject) {
        translateX.value = withTiming(-500, { duration: 200 });
        runOnJS(onReject)();
      } else {
        translateX.value = withTiming(0, { duration: 250 });
      }
    });

  // Race, não Simultaneous: os três são idiomas concorrentes para o mesmo
  // toque. O pan só ativa depois de 10px (`activeOffsetX`), então segurar
  // parado resolve para o long-press sem ambiguidade.
  const longPress = Gesture.LongPress()
    .enabled(!disabled && !selectable && !!onLongPress)
    .onStart(() => {
      runOnJS(triggerHaptic)();
      if (onLongPress) runOnJS(onLongPress)();
    });

  const tap = Gesture.Tap()
    .enabled(!!selectable && !!onToggleSelect)
    .onStart(() => {
      if (onToggleSelect) runOnJS(onToggleSelect)();
    });

  const gesture = Gesture.Race(pan, longPress, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const acceptBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 10 ? Math.min(translateX.value / SWIPE_THRESHOLD, 1) : 0,
  }));
  const rejectBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -10 ? Math.min(-translateX.value / SWIPE_THRESHOLD, 1) : 0,
  }));

  return (
    <View style={s.root}>
      <SwipeRevealBackground acceptStyle={acceptBgStyle} rejectStyle={rejectBgStyle} />

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            s.card,
            cardStyle,
            disabled && s.cardDisabled,
            boost?.is_boosting && s.cardBoosted,
            selected && s.cardSelected,
            !!failureReason && s.cardFailed,
          ]}
          accessibilityRole={selectable ? 'checkbox' : undefined}
          accessibilityState={selectable ? { checked: !!selected } : undefined}
          accessibilityLabel={
            selectable
              ? `${request.display_title || request.song_title}, ${selected ? 'selecionado' : 'não selecionado'}`
              : undefined
          }
        >
          {/*
            🔴 "a confirmar" NUNCA vira "recebido" antes do webhook.
            `awaiting_payment` significa que a cobrança existe e o fã ainda não
            pagou — anunciar como receita aqui é a mesma falha que somar
            `held_balance` ao saldo sacável da carteira.
          */}
          {boost?.is_boosting && (
            <LinearGradient
              colors={gradients.energy}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.boostStrip}
            >
              <ArrowUp size={13} color="#FFFFFF" />
              <Text style={s.boostAmount}>
                R$ {boost.amount.toFixed(2).replace('.', ',')}
              </Text>
              <Text style={s.boostStatus}>{boostStatusLabel(boost.status)}</Text>
            </LinearGradient>
          )}

          <View style={s.header}>
            {selectable && (
              <View style={[s.selectDot, selected && s.selectDotOn]}>
                {selected && <Check size={15} color={colors.text.inverse} strokeWidth={3} />}
              </View>
            )}
            <Text style={s.songTitle} numberOfLines={2}>{request.display_title || request.song_title}</Text>
            {request.is_urgent && (
              <View style={s.urgentBadge}>
                <Clock size={12} color={colors.status.error} />
                <Text style={s.urgentText}>Urgente</Text>
              </View>
            )}
          </View>

          {!!request.artist && <Text style={s.artist}>{request.artist}</Text>}
          {request.has_message && !!request.message && (
            <Text style={s.message} numberOfLines={2}>&ldquo;{request.message}&rdquo;</Text>
          )}

          {/*
            A dedicatória chega crua para o músico mesmo antes do pagamento —
            é metade do motivo para aceitar. Quem a redige para o PÚBLICO é o
            backend (`Request.publicDedication`), e só depois de paga.
          */}
          {!!boost?.dedication && (
            <View style={s.dedication}>
              <Gift size={13} color={colors.accent.coral} />
              <Text style={s.dedicationText} numberOfLines={3}>
                {boost.dedication}
              </Text>
            </View>
          )}

          {/*
            O motivo vem do backend (`BatchRespondFailure.reason`) e fica NO
            card, não num toast. Num lote de 30, "3 falharam" sem dizer quais
            obriga o músico a conferir a fila item a item durante o show.
          */}
          {!!failureReason && (
            <View style={s.failureRow}>
              <AlertCircle size={13} color={colors.status.error} />
              <Text style={s.failureText}>{failureReason}</Text>
            </View>
          )}

          {/* Em modo seleção quem age é a barra flutuante — dois caminhos para
              a mesma ação, um por card e um por lote, só geram engano. */}
          {!selectable && (
          <View style={s.footer}>
            <Pressable
              onPress={onReject}
              disabled={disabled}
              style={s.rejectBtn}
              accessibilityRole="button"
              accessibilityLabel="Rejeitar pedido"
              hitSlop={8}
            >
              <X size={22} color={colors.accent.coral} />
            </Pressable>
            <Pressable
              onPress={onAccept}
              disabled={disabled}
              style={s.acceptBtn}
              accessibilityRole="button"
              accessibilityLabel="Aceitar pedido"
              hitSlop={8}
            >
              <Check size={22} color={colors.text.inverse} />
            </Pressable>
          </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
