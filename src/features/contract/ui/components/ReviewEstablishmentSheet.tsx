import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Star } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { StarRatingInput } from '@/shared/components/StarRatingInput';
import {
  getSubmitReviewErrorMessage,
  useSubmitEstablishmentReview,
} from '../../application/useEstablishmentReview';
import { submitReviewSchema } from '../../domain/review.validation';

type Props = {
  establishmentId: string | null;
  bookingId:       string | null;
  /** Nome da casa, vindo do snapshot do contrato (`variables.local_nome`). */
  venueName:       string;
  visible:         boolean;
  onClose:         () => void;
  onSubmitted:     () => void;
};

const COMMENT_MAX = 1000;

/**
 * O músico avalia a casa onde tocou.
 *
 * ⚠️ **Só Zod, sem `react-hook-form`.** São dois campos e o submit é do próprio
 * sheet — encaixar RHF aqui exigiria `Controller` para uma nota que não é
 * `TextInput`, sem ganho nenhum. É o mesmo tratamento dos steps do wizard,
 * documentado no CLAUDE.md.
 *
 * ⚠️ **`BottomSheetView` com `enableDynamicSizing`**, não `ScrollView`: o
 * conteúdo é curto e fixo, diferente do contrato — que precisa de rolagem porque
 * o documento é longo.
 *
 * O botão não é escondido de quem já avaliou: o backend faz upsert por
 * `(alvo, autor, contexto)`, então reenviar corrige a nota em vez de duplicá-la.
 */
export function ReviewEstablishmentSheet({
  establishmentId,
  bookingId,
  venueName,
  visible,
  onClose,
  onSubmitted,
}: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitReview = useSubmitEstablishmentReview(establishmentId);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // Reabrir noutra reserva não pode herdar a nota nem o texto da anterior.
  useEffect(() => {
    setRating(0);
    setComment('');
    setError(null);
  }, [bookingId]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  async function submit() {
    if (!bookingId) return;
    setError(null);

    const parsed = submitReviewSchema.safeParse({
      rating,
      comment: comment.trim() || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira a nota e o comentário.');
      return;
    }

    try {
      await submitReview.mutateAsync({
        rating:       parsed.data.rating,
        comment:      parsed.data.comment ?? null,
        context_type: 'booking',
        context_id:   bookingId,
      });
      onSubmitted();
    } catch (err) {
      setError(getSubmitReviewErrorMessage(err));
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      /*
       * Sem estes dois, o teclado do Android cobre o campo de comentário E o
       * botão de enviar — a pessoa digita às cegas e não alcança o submit.
       * Padrão de `InviteMemberSheet`, o sheet com input do projeto.
       */
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <View style={s.headerRow}>
          <Star size={20} color={colors.accent.amber} />
          <Text style={s.title}>Como foi tocar aqui?</Text>
        </View>

        <Text style={s.subtitle} numberOfLines={2}>
          Sua avaliação de {venueName} ajuda outros músicos a decidirem antes de aceitar um show.
        </Text>

        <StarRatingInput value={rating} onChange={setRating} disabled={submitReview.isPending} />

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Estrutura, pagamento, tratamento… (opcional)"
          placeholderTextColor={colors.text.muted}
          style={s.commentInput}
          multiline
          maxLength={COMMENT_MAX}
          editable={!submitReview.isPending}
          accessibilityLabel="Comentário sobre o estabelecimento"
        />

        {!!error && <ErrorBanner message={error} />}

        <PrimaryButton
          label="Enviar avaliação"
          onPress={submit}
          loading={submitReview.isPending}
          disabled={rating === 0}
          style={s.fullWidth}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  commentInput: {
    width:             '100%',
    minHeight:         88,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border.default,
    padding:           spacing.md,
    ...typography.body,
    color:             colors.text.primary,
    textAlignVertical: 'top',
  },
  fullWidth: {
    width: '100%',
  },
});
