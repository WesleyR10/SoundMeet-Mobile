import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { MessageSquare } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { annotationTextSchema, ANNOTATION_MAX_LENGTH } from '../../domain/personal-chord-sheet.validation';
import { useSheetModalVisibility } from '@/shared/hooks/useSheetModalVisibility';

type Props = {
  visible:   boolean;
  loading?:  boolean;
  /** Erro do salvamento, vindo de fora (o de validação é local). */
  serverError?: string | null;
  onConfirm: (text: string) => void;
  onClose:   () => void;
};

// Anotação PÚBLICA (edit type `annotate`) — ícone de balão, cor teal, só
// alcançável em modo Editar. Deliberadamente um componente e um fluxo
// diferentes de PersonalNotesSheet (nota privada): a distinção precisa
// sobreviver mesmo a um usuário que não lê texto de ajuda (ver plano §3).
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

export function AnnotationSheet({ visible, loading, serverError, onConfirm, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { sheetRef, trackDismiss } = useSheetModalVisibility(visible);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setText('');
    setError(null);
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  function handleConfirm() {
    const result = annotationTextSchema.safeParse(text);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Anotação inválida');
      return;
    }
    setError(null);
    onConfirm(result.data);
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={trackDismiss(onClose)}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <View style={s.header}>
          <MessageSquare size={20} color={colors.brand.primary} />
          <Text style={s.title}>Anotação</Text>
        </View>
        <Text style={s.hint}>Visível pra quem você compartilhar esta cifra (banda ou comunidade).</Text>

        <FormField
          label={`Anotação (${text.length}/${ANNOTATION_MAX_LENGTH})`}
          value={text}
          onChangeText={setText}
          placeholder="Ex.: toque com palm mute aqui"
          multiline
        />

        {!!(error ?? serverError) && <ErrorBanner message={(error ?? serverError)!} />}

        <PrimaryButton label="Salvar anotação" onPress={handleConfirm} loading={loading} style={s.confirmBtn} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}
