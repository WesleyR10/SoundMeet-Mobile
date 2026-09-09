import { useState } from 'react';
import { View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { CheckCircle2, Star } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useContractBooking } from '../../application/useEstablishmentReview';
import { canReviewEstablishment } from '../../domain/review.validation';
import { ReviewEstablishmentSheet } from './ReviewEstablishmentSheet';
import type { Contract } from '../../domain/contract.types';

type Props = {
  contract: Contract;
  /** Estilo do rodapé, cedido pela tela — o componente decide SE ele existe. */
  footerStyle?: StyleProp<ViewStyle>;
};

/**
 * "Avaliar o estabelecimento" — toda a preocupação de avaliação num lugar só.
 *
 * Mora aqui, e não na tela, porque encapsula três coisas que andam juntas:
 * descobrir se o show já foi concluído, oferecer a ação e confirmar o envio.
 * A tela de contrato só precisa saber que existe um rodapé possível.
 *
 * ⚠️ **Não renderiza nada até o show estar `completed`.** É o único status que
 * o backend aceita como prova de vínculo; oferecer antes daria 403 no toque.
 * A promoção `confirmed → completed` é do job horário do backend, então a ação
 * aparece sozinha em até uma hora depois do fim da apresentação.
 */
const useStyles = makeStyles((colors) => ({
  cta: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm,
    height:         56,
    borderRadius:   radius.xl,
    borderWidth:    1,
    borderColor:    colors.accent.amber,
  },
  ctaLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.amber,
  },
  doneRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm,
    height:         56,
  },
  doneText: {
    ...typography.bodySm,
    color: colors.status.success,
  },
}));

export function ContractReviewAction({ contract, footerStyle }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [reviewing, setReviewing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Show de banda nunca é avaliável (ver `canReviewEstablishment`), então nem
  // vale gastar o GET da reserva para descobrir um status que não muda nada.
  const isBandShow = contract.band_id !== null;
  const { data: booking } = useContractBooking(
    isBandShow ? null : contract.booking_id,
  );

  const reviewable = canReviewEstablishment({
    booking: booking ?? null,
    isBandShow,
  });

  if (!reviewable) return null;

  return (
    <View style={footerStyle}>
      {submitted ? (
        <View style={s.doneRow}>
          <CheckCircle2 size={16} color={colors.status.success} />
          <Text style={s.doneText}>Avaliação enviada. Obrigado!</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => setReviewing(true)}
          style={s.cta}
          accessibilityRole="button"
          accessibilityLabel={`Avaliar ${contract.variables.local_nome}`}
        >
          <Star size={18} color={colors.accent.amber} />
          <Text style={s.ctaLabel}>Avaliar estabelecimento</Text>
        </Pressable>
      )}

      {/*
        ⚠️ FORA do condicional de propósito. Enviar troca `submitted` para
        `true` no mesmo commit em que pede o `dismiss()`; se o sheet estivesse
        dentro do ramo, seria desmontado antes de o `useEffect` rodar — sem
        animação de saída e com risco de o backdrop ficar preso na tela.
      */}
      <ReviewEstablishmentSheet
        establishmentId={contract.establishment_id}
        bookingId={contract.booking_id}
        venueName={contract.variables.local_nome}
        visible={reviewing}
        onClose={() => setReviewing(false)}
        onSubmitted={() => {
          setReviewing(false);
          setSubmitted(true);
        }}
      />
    </View>
  );
}
