import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp } from 'lucide-react-native';
import { spacing, radius, typography, gradients, shadows } from '@/shared/design-system/tokens';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { usePendingBoostStore } from '../../application/pending-boost.store';
import { useAudienceRequests } from '../../application/useAudienceRequests';
import { RequestBoostPaymentSheet } from './RequestBoostPaymentSheet';

/**
 * Barra flutuante de "pedido aceito, pague o destaque" + a folha do QR.
 *
 * ## Por que fica no navigator, e não numa tela
 *
 * 🔴 O público **não tem push registrado** — `Audience` não tem `push_token`,
 * só `Musician`. O socket é o único aviso em tempo real, e ele chega com o fã
 * em qualquer aba. Uma barra presa à Home só apareceria se ele por acaso
 * estivesse lá; a janela de pagamento tem minutos.
 *
 * Fica acima da tab bar de propósito: é uma pendência com prazo, não uma
 * notificação passiva.
 */
export function PendingBoostHost() {
  const pending    = usePendingBoostStore((s) => s.pending);
  const setPending = usePendingBoostStore((s) => s.setPending);
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  /*
   * Cold start: o store é memória pura, então quem fechou o app perdeu a
   * pendência. A lista de pedidos devolve.
   *
   * O QR não vem daqui (a listagem não o carrega) — a folha o busca em
   * `GET /requests/:id/boost/payment` ao abrir. O banner só precisa saber que
   * existe algo a pagar.
   */
  const { data: requests } = useAudienceRequests(audienceId);

  useEffect(() => {
    if (pending || !requests) return;

    const awaiting = requests.find(
      (request) => request.boost?.status === 'awaiting_payment',
    );
    if (!awaiting?.boost?.tip_id) return;

    setPending({
      request_id:      awaiting.id,
      tip_id:          awaiting.boost.tip_id,
      song_title:      awaiting.song_title,
      amount:          awaiting.boost.amount,
      qr_code:         null,
      copy_paste_code: null,
      expires_at:      null,
    });
  }, [requests, pending, setPending]);

  return (
    <>
      {!!pending && !openRequestId && (
        <Animated.View
          entering={FadeInDown.springify().damping(16)}
          exiting={FadeOutDown.duration(180)}
          style={s.wrap}
        >
          <Pressable
            onPress={() => setOpenRequestId(pending.request_id)}
            accessibilityRole="button"
            accessibilityLabel={`Concluir o PIX de ${pending.amount} reais para destacar ${pending.song_title}`}
          >
            <LinearGradient
              colors={gradients.energy}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.banner}
            >
              <View style={s.icon}>
                <ArrowUp size={16} color="#FFFFFF" />
              </View>
              <View style={s.text}>
                <Text style={s.title} numberOfLines={1}>
                  Pedido aceito — conclua o PIX
                </Text>
                <Text style={s.subtitle} numberOfLines={1}>
                  {pending.song_title} · R${' '}
                  {pending.amount.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <Text style={s.cta}>Pagar</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      <RequestBoostPaymentSheet
        requestId={openRequestId}
        onClose={() => setOpenRequestId(null)}
      />
    </>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left:      spacing.lg,
    right:     spacing.lg,
    // Acima da tab bar do fã, sem cobri-la.
    bottom:    96,
  },
  banner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    paddingVertical:    spacing.md,
    paddingHorizontal:  spacing.lg,
    borderRadius:       radius.xl,
    ...shadows.coral,
  },
  icon: {
    width:           30,
    height:          30,
    borderRadius:    radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  text: { flex: 1 },
  title: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      '#FFFFFF',
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  cta: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      '#FFFFFF',
  },
});
