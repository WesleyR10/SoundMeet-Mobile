import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Users } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { StageTechSpecSection } from '@/shared/components/StageTechSpecSection';
import { useDecideInquiry, useInquiryEstablishment, getDecideInquiryErrorMessage } from '../../application/useInquiries';
import { expiryLabel, isActionable, isBandInquiry, statusLabel } from '../../domain/inquiry.rules';
import type { Inquiry } from '../../domain/inquiry.types';

type Props = {
  inquiry:    Inquiry | null;
  musicianId: string | null;
  onClose:    () => void;
};

/**
 * Momento da decisão — é aqui que a Ficha Técnica do Palco (A3) paga.
 *
 * A pergunta que o músico faz antes de aceitar é "o que tem lá e o que eu
 * preciso levar?". Até esta tela existir, a ficha só era legível pelo fã
 * navegando o perfil da casa — nunca por quem estava decidindo se toca lá.
 *
 * ⚠️ `BottomSheetScrollView`, não `BottomSheetView`: a ficha técnica completa
 * não cabe numa altura dinâmica e o conteúdo ficaria cortado sem rolagem.
 *
 * ⚠️ A casa é buscada AQUI, não na lista. `InquiryPresenter` carrega só o
 * `establishment_id`, e resolver por linha seria um N+1 visível — a ficha só
 * importa neste ponto.
 */
export function InquiryDecisionSheet({ inquiry, musicianId, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const { accept, reject } = useDecideInquiry(musicianId);
  const establishmentQuery = useInquiryEstablishment(inquiry?.establishment_id ?? null);

  useEffect(() => {
    if (inquiry) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [inquiry]);

  // Estado local é por decisão: reabrir o sheet noutra proposta não pode
  // herdar o motivo digitado na anterior.
  useEffect(() => {
    setError(null);
    setRejecting(false);
    setReason('');
  }, [inquiry?.id]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  if (!inquiry) return null;

  const establishment = establishmentQuery.data ?? null;
  const actionable = isActionable(inquiry);
  const isPending = accept.isPending || reject.isPending;

  async function decide(action: 'accept' | 'reject') {
    if (!inquiry) return;
    setError(null);
    try {
      if (action === 'accept') {
        await accept.mutateAsync(inquiry.id);
      } else {
        await reject.mutateAsync({ inquiryId: inquiry.id, reason });
      }
      onClose();
    } catch (err) {
      setError(getDecideInquiryErrorMessage(err));
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      snapPoints={['85%']}
    >
      <BottomSheetScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{establishment?.name ?? 'Proposta de show'}</Text>
        <Text style={s.status}>
          {statusLabel(inquiry)}
          {expiryLabel(inquiry) ? ` · ${expiryLabel(inquiry)}` : ''}
        </Text>

        {!!inquiry.subject && <Text style={s.subject}>{inquiry.subject}</Text>}

        {!!inquiry.initial_message && (
          <View style={s.messageBox}>
            <Text style={s.messageText}>{inquiry.initial_message}</Text>
          </View>
        )}

        {isBandInquiry(inquiry) && (
          <View style={s.bandNotice}>
            <Users size={14} color={colors.text.muted} />
            <Text style={s.bandNoticeText}>
              Proposta para a banda — só o líder pode aceitar ou recusar.
            </Text>
          </View>
        )}

        {establishmentQuery.isPending ? (
          <ActivityIndicator color={colors.brand.primary} style={s.loader} />
        ) : (
          <StageTechSpecSection spec={establishment?.profile?.stage_tech_spec ?? null} />
        )}

        {!!error && <ErrorBanner message={error} />}

        {actionable ? (
          <View style={s.actions}>
            {rejecting ? (
              <>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Motivo (opcional)"
                  placeholderTextColor={colors.text.muted}
                  style={s.reasonInput}
                  multiline
                  accessibilityLabel="Motivo da recusa"
                />
                <PrimaryButton
                  label="Confirmar recusa"
                  onPress={() => decide('reject')}
                  loading={reject.isPending}
                  style={s.fullWidth}
                />
                <Pressable
                  onPress={() => setRejecting(false)}
                  disabled={isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                  hitSlop={8}
                >
                  <Text style={s.laterLabel}>Voltar</Text>
                </Pressable>
              </>
            ) : (
              <>
                <PrimaryButton
                  label="Aceitar proposta"
                  onPress={() => decide('accept')}
                  loading={accept.isPending}
                  style={s.fullWidth}
                />
                <Pressable
                  onPress={() => setRejecting(true)}
                  disabled={isPending}
                  style={s.declineBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Recusar proposta"
                >
                  <Text style={s.declineLabel}>Recusar</Text>
                </Pressable>
                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Decidir depois" hitSlop={8}>
                  <Text style={s.laterLabel}>Decidir depois</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          // Sem botões quando o servidor recusaria: proposta já respondida ou
          // com prazo vencido devolve 422. Oferecer a ação seria pior que
          // escondê-la.
          <Text style={s.closedNotice}>Esta proposta não está mais aberta para resposta.</Text>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:     radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom:      spacing.xxxl,
    gap:                 spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  status: {
    ...typography.caption,
    color: colors.text.muted,
  },
  subject: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  messageBox: {
    borderLeftWidth:  2,
    borderLeftColor: colors.accent.violet,
    paddingLeft:      spacing.md,
  },
  messageText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  bandNotice: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  bandNoticeText: {
    ...typography.bodySm,
    color: colors.text.muted,
    flex:  1,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  actions: {
    gap:       spacing.md,
    alignItems: 'center',
    marginTop:  spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  declineBtn: {
    width:          '100%',
    height:          48,
    borderRadius:    radius.xl,
    borderWidth:      1,
    borderColor:     colors.border.strong,
    alignItems:      'center',
    justifyContent:  'center',
  },
  declineLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  laterLabel: {
    ...typography.bodySm,
    color:              colors.text.muted,
    textDecorationLine: 'underline',
  },
  reasonInput: {
    width:            '100%',
    minHeight:         88,
    borderRadius:      radius.md,
    borderWidth:        1,
    borderColor:       colors.border.default,
    padding:            spacing.md,
    ...typography.body,
    color:             colors.text.primary,
    textAlignVertical: 'top',
  },
  closedNotice: {
    ...typography.bodySm,
    color:     colors.text.muted,
    textAlign: 'center',
    marginTop:  spacing.md,
  },
});
