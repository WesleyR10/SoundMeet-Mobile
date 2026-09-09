import { Modal, Pressable, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { maskBrDate, parseBrDate } from '@/shared/utils/date-format';
import { blockPeriodSchema, type BlockPeriodFormValues } from '../../domain/availability.validation';

type Props = {
  visible:   boolean;
  isSaving:  boolean;
  onConfirm: (payload: { start: Date; end: Date; reason: string | null }) => void;
  onCancel:  () => void;
};

// Bloqueio por datas digitadas (botão + de "Férias e bloqueios") — resolve o
// cenário que o grid resolve mal: bloquear algo distante (férias em dezembro)
// sem paginar mês a mês. Datas em DD/MM/AAAA validadas pelo blockPeriodSchema.
const useStyles = makeStyles((colors) => ({
  backdrop: {
    flex:            1,
    backgroundColor: colors.bg.overlay,
    justifyContent:  'center',
    padding:          spacing.xl,
  },
  card: {
    gap:              spacing.lg,
    padding:          spacing.xl,
    borderRadius:     radius.lg,
    borderWidth:       1,
    borderColor:      colors.border.strong,
    backgroundColor:  colors.bg.elevated,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  cancelBtn: {
    minHeight:       48,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cancelText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
}));

export function BlockPeriodModal({ visible, isSaving, onConfirm, onCancel }: Props) {
  const s = useStyles();
  const { control, handleSubmit, reset } = useForm<BlockPeriodFormValues>({
    resolver:      zodResolver(blockPeriodSchema),
    defaultValues: { start_date: '', end_date: '', reason: '' },
  });

  const submit = handleSubmit((values) => {
    // parseBrDate nunca é null aqui — o schema já validou o formato.
    onConfirm({
      start:  parseBrDate(values.start_date)!,
      end:    parseBrDate(values.end_date)!,
      reason: values.reason.trim() || null,
    });
    reset();
  });

  const cancel = () => {
    reset();
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.title}>Bloquear período</Text>
          <Text style={s.subtitle}>Do início ao fim — o dia todo em cada data.</Text>

          <Controller
            control={control}
            name="start_date"
            render={({ field, fieldState }) => (
              <FormField
                label="Início"
                value={field.value}
                onChangeText={(v) => field.onChange(maskBrDate(v))}
                onBlur={field.onBlur}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="end_date"
            render={({ field, fieldState }) => (
              <FormField
                label="Fim"
                value={field.value}
                onChangeText={(v) => field.onChange(maskBrDate(v))}
                onBlur={field.onBlur}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="reason"
            render={({ field }) => (
              <FormField
                label="Motivo (opcional)"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ex.: férias, viagem, compromisso"
                autoCapitalize="sentences"
              />
            )}
          />

          <PrimaryButton
            label={isSaving ? 'Salvando…' : 'Confirmar bloqueio'}
            onPress={submit}
            disabled={isSaving}
          />
          <Pressable onPress={cancel} style={s.cancelBtn} accessibilityRole="button" accessibilityLabel="Cancelar">
            <Text style={s.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
