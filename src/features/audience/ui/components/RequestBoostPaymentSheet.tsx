import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, ArrowUp } from 'lucide-react-native';
import { spacing, radius, typography, gradients } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { QRFrame } from '@/shared/components/QRFrame';
import { useRequestBoostPayment } from '../../application/useRequestBoostPayment';
import { usePendingBoostStore } from '../../application/pending-boost.store';

type Props = {
  requestId: string | null;
  onClose: () => void;
};

/**
 * O QR da cobrança do destaque.
 *
 * Abre quando o músico aceita (socket `request.boost.payment_ready`) ou pelo
 * banner de pendência. A fonte da verdade é sempre o servidor
 * (`GET /requests/:id/boost/payment`) — o payload do socket serve como
 * primeira pintura, para o QR aparecer sem esperar a requisição.
 */
const useStyles = makeStyles((colors) => ({
  sheetBg: { backgroundColor: colors.bg.elevated },
  handle:  { backgroundColor: colors.border.strong },
  container: { flex: 1 },
  scroll: {
    alignItems:        'center',
    paddingHorizontal:  spacing.xl,
    paddingBottom:      spacing.xxxl,
    gap:                spacing.md,
  },
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    paddingVertical:    spacing.xs,
    paddingHorizontal:  spacing.md,
    borderRadius:       radius.full,
  },
  badgeText: {
    ...typography.caption,
    color:         '#FFFFFF',
    letterSpacing: 1,
  },
  title: {
    ...typography.displayMd,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  countdown: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    paddingVertical:    spacing.xs,
    paddingHorizontal:  spacing.md,
    borderRadius:       radius.full,
    backgroundColor:   `${colors.accent.amber}1A`,
  },
  countdownText: {
    ...typography.bodySm,
    color: colors.accent.amber,
  },
  qrWrap: { marginTop: spacing.sm },
  copyBox: {
    width:            '100%',
    borderRadius:      radius.lg,
    borderWidth:       1,
    borderColor:       colors.border.default,
    backgroundColor:  'rgba(255,255,255,0.03)',
    padding:           spacing.md,
    gap:               spacing.xs,
  },
  copyLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  copyText: {
    ...typography.mono,
    color: colors.text.primary,
  },
  copyHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  expiredBox: {
    width:           '100%',
    padding:          spacing.lg,
    borderRadius:     radius.lg,
    backgroundColor: `${colors.text.muted}1A`,
    gap:              spacing.xs,
  },
  expiredTitle: {
    ...typography.title,
    fontSize: 16,
    color:    colors.text.primary,
  },
  expiredText: {
    ...typography.bodySm,
    color:      colors.text.secondary,
    lineHeight: 19,
  },
  dedicationBox: {
    width:           '100%',
    padding:          spacing.md,
    borderRadius:     radius.md,
    borderLeftWidth:  3,
    borderLeftColor:  colors.accent.coral,
    backgroundColor: `${colors.accent.coral}0F`,
    gap:              spacing.xs,
  },
  dedicationLabel: {
    ...typography.caption,
    color:         colors.accent.coral,
    letterSpacing: 1,
  },
  dedicationText: {
    ...typography.body,
    color:     colors.text.primary,
    fontStyle: 'italic',
  },
  dedicationHint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  dismiss: {
    minHeight:      48,
    justifyContent: 'center',
    marginTop:      spacing.sm,
  },
  dismissLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
}));

export function RequestBoostPaymentSheet({ requestId, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const pending  = usePendingBoostStore((s) => s.pending);
  const clearPending = usePendingBoostStore((s) => s.clear);

  const { data } = useRequestBoostPayment(requestId);

  useEffect(() => {
    if (requestId) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [requestId]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Enquanto o servidor não responde, mostra o que o socket trouxe.
  const view = data ?? (pending?.request_id === requestId ? pending : null);
  const status = data?.status ?? 'awaiting_payment';

  const [remaining, setRemaining] = useState<number | null>(null);

  const expiresAt = useMemo(() => {
    const raw = data?.expires_at ?? pending?.expires_at ?? null;
    return raw ? new Date(raw).getTime() : null;
  }, [data?.expires_at, pending?.expires_at]);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Pagou: o banner some e a celebração assume (disparada pelo socket).
  useEffect(() => {
    if (status === 'paid' && requestId) {
      clearPending(requestId);
      sheetRef.current?.dismiss();
    }
  }, [status, requestId, clearPending]);

  const minutes = remaining !== null ? Math.floor(remaining / 60_000) : null;
  const seconds = remaining !== null ? Math.floor((remaining % 60_000) / 1_000) : null;
  const isExpired = status === 'expired' || remaining === 0;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['85%']}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.container}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={gradients.energy}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.badge}
          >
            <ArrowUp size={14} color="#FFFFFF" />
            <Text style={s.badgeText}>PEDIDO ACEITO</Text>
          </LinearGradient>

          <Text style={s.title} numberOfLines={2}>
            {view?.song_title ?? 'Seu pedido'}
          </Text>
          <Text style={s.subtitle}>
            Conclua o PIX de R$ {(view?.amount ?? 0).toFixed(2).replace('.', ',')} pra
            garantir o destaque.
          </Text>

          {isExpired ? (
            <View style={s.expiredBox}>
              <Text style={s.expiredTitle}>Tempo esgotado</Text>
              <Text style={s.expiredText}>
                O prazo de pagamento venceu, então o destaque saiu. Seu pedido
                continua aceito pelo artista — nada foi cobrado.
              </Text>
            </View>
          ) : (
            <>
              {remaining !== null && (
                <View style={s.countdown}>
                  <Clock size={14} color={colors.accent.amber} />
                  <Text style={s.countdownText}>
                    {String(minutes).padStart(2, '0')}:
                    {String(seconds).padStart(2, '0')} pra concluir
                  </Text>
                </View>
              )}

              {!!view?.qr_code && (
                <View style={s.qrWrap}>
                  <QRFrame value={view.qr_code} size={220} />
                </View>
              )}

              {!!view?.copy_paste_code && (
                <View style={s.copyBox}>
                  <Text style={s.copyLabel}>Código copia e cola</Text>
                  <Text selectable style={s.copyText}>
                    {view.copy_paste_code}
                  </Text>
                  <Text style={s.copyHint}>Toque e segure pra copiar</Text>
                </View>
              )}
            </>
          )}

          {!!data?.dedication && (
            <View style={s.dedicationBox}>
              <Text style={s.dedicationLabel}>SUA DEDICATÓRIA</Text>
              <Text style={s.dedicationText}>{data.dedication}</Text>
              <Text style={s.dedicationHint}>
                Vai aparecer no palco assim que o pagamento confirmar.
              </Text>
            </View>
          )}

          <Pressable
            style={s.dismiss}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Text style={s.dismissLabel}>Fechar</Text>
          </Pressable>
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
