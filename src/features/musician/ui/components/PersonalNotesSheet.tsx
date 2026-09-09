import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Lock } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { personalNotesSchema } from '../../domain/personal-chord-sheet.validation';

type Props = {
  visible:      boolean;
  initialNotes: string | null;
  loading?:     boolean;
  onConfirm:    (notes: string | null) => void;
  onClose:      () => void;
};

// Notas PRIVADAS (PATCH .../notes) — ícone de cadeado, cor neutra. Nunca
// aparece pra terceiros, nem se o fork for compartilhado com banda/comunidade
// (o backend garante isso — este componente só existe pra ficar visualmente
// distinto de AnnotationSheet, não pra reforçar a regra de negócio).
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
    paddingBottom:      spacing.xxl,
    gap:                 spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  hint: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  confirmBtn: {
    marginTop: spacing.sm,
  },
}));

export function PersonalNotesSheet({ visible, initialNotes, loading, onConfirm, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setNotes(initialNotes ?? '');
      setError(null);
    }
  }, [visible, initialNotes]);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  function handleConfirm() {
    const result = personalNotesSchema.safeParse(notes);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Nota inválida');
      return;
    }
    setError(null);
    onConfirm(result.data.length > 0 ? result.data : null);
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <View style={s.header}>
          <Lock size={20} color={colors.text.secondary} />
          <Text style={s.title}>Minhas notas (privadas)</Text>
        </View>
        <Text style={s.hint}>
          Só você vê isso. Nunca aparece pra outros músicos, nem se você compartilhar essa cifra com a banda ou comunidade.
        </Text>

        <FormField
          label={`Notas (${notes.length}/5000)`}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ex.: lembrar de afinar meio tom abaixo nesse show"
          multiline
        />

        {!!error && <ErrorBanner message={error} />}

        <PrimaryButton label="Salvar notas" onPress={handleConfirm} loading={loading} style={s.confirmBtn} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}
