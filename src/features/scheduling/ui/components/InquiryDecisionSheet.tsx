import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Users } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { StageTechSpecSection } from '@/shared/components/StageTechSpecSection';
import { useDecideInquiry, useInquiryEstablishment, getDecideInquiryErrorMessage } from '../../application/useInquiries';
import { useBookingOfferById, useRespondToOffer } from '../../application/useBookingOffer';
import { expiryLabel, inquiryDecisionMode, isBandInquiry, statusLabel } from '../../domain/inquiry.rules';
import { ProposalCard } from './ProposalCard';
import { TermsPendingNotice } from './TermsPendingNotice';
import { InquiryInterestActions } from './InquiryInterestActions';
import type { Inquiry } from '../../domain/inquiry.types';
import { useSheetModalVisibility } from '@/shared/hooks/useSheetModalVisibility';

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
 * 🔴 Os TERMOS vêm primeiro (25/set/2026). A pergunta número um é "quando e
 * quanto?", e a tela mostrava ficha técnica e passagem de som sem nunca dizer o
 * horário do show nem o cachê. Uma inquiry não os tem — só o booking em que ela
 * vira. Por isso: com booking, o bilhete (`ProposalCard`, o mesmo do chat) e a
 * resposta é sobre o SHOW; sem booking, o aviso de que ainda não há termos e o
 * botão vira "Tenho interesse". Ver `inquiryDecisionMode`.
 *
 * ⚠️ A casa é buscada AQUI, não na lista. `InquiryPresenter` carrega só o
 * `establishment_id`, e resolver por linha seria um N+1 visível — a ficha só
 * importa neste ponto.
 */
const useStyles = makeStyles((colors) => ({
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
  flush: {
    paddingHorizontal: 0,
    paddingTop:        0,
  },
  closedNotice: {
    ...typography.bodySm,
    color:     colors.text.muted,
    textAlign: 'center',
    marginTop:  spacing.md,
  },
}));

export function InquiryDecisionSheet({ inquiry, musicianId, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { sheetRef, trackDismiss } = useSheetModalVisibility(!!inquiry);
  const [error, setError] = useState<string | null>(null);

  const { accept, reject } = useDecideInquiry(musicianId);
  const establishmentQuery = useInquiryEstablishment(inquiry?.establishment_id ?? null);
  const offerQuery = useBookingOfferById(inquiry?.booking_id ?? null);
  // Sem conversa aqui: a resposta ao show não deixa mensagem no fio (o
  // painel da casa é avisado pelo `booking.updated` do mesmo jeito).
  const respond = useRespondToOffer(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  if (!inquiry) return null;

  const establishment = establishmentQuery.data ?? null;
  const mode = inquiryDecisionMode(inquiry);
  const offer = offerQuery.data ?? null;

  async function decide(action: 'accept' | 'reject', reason?: string) {
    if (!inquiry) return;
    setError(null);
    try {
      if (action === 'accept') await accept.mutateAsync(inquiry.id);
      else await reject.mutateAsync({ inquiryId: inquiry.id, reason });
      onClose();
    } catch (err) {
      setError(getDecideInquiryErrorMessage(err));
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={trackDismiss(onClose)}
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

        {mode === 'offer' && (offer ? (
          <ProposalCard
            offer={offer}
            accepting={respond.accept.isPending}
            declining={respond.decline.isPending}
            errorMessage={respond.errorMessage}
            onAccept={() => respond.accept.mutate(offer)}
            onDecline={() => respond.decline.mutate(offer)}
            style={s.flush}
          />
        ) : offerQuery.isError ? (
          <ErrorBanner message="Não conseguimos carregar data e cachê desta proposta. Feche e abra de novo." />
        ) : (
          <ActivityIndicator color={colors.brand.primary} style={s.loader} />
        ))}

        {mode === 'interest' && <TermsPendingNotice />}

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

        {mode === 'interest' && (
          <InquiryInterestActions
            key={inquiry.id}
            accepting={accept.isPending}
            rejecting={reject.isPending}
            onAccept={() => decide('accept')}
            onReject={(reason) => decide('reject', reason)}
            onLater={onClose}
          />
        )}

        {mode === 'closed' && (
          // Sem botões quando o servidor recusaria: proposta já respondida ou
          // com prazo vencido devolve 422. Oferecer a ação seria pior que
          // escondê-la.
          <Text style={s.closedNotice}>Esta proposta não está mais aberta para resposta.</Text>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
