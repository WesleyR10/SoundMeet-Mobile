import { useState } from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';

type Props = {
  visible:    boolean;
  startLabel: string;
  endLabel:   string;
  isSaving:   boolean;
  onConfirm:  (reason: string | null) => void;
  onCancel:   () => void;
};

// Confirmação do bloqueio selecionado no calendário (férias/indisponibilidade):
// período vem da seleção no grid; aqui só o motivo opcional + confirmar.
export function AddUnavailabilityModal({ visible, startLabel, endLabel, isSaving, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || null);
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.title}>Bloquear agenda</Text>
          <Text style={s.subtitle}>
            {startLabel === endLabel ? startLabel : `${startLabel} até ${endLabel}`} — o dia todo.
          </Text>

          <FormField
            label="Motivo (opcional)"
            value={reason}
            onChangeText={setReason}
            placeholder="Ex.: férias, viagem, compromisso"
            autoCapitalize="sentences"
          />

          <PrimaryButton
            label={isSaving ? 'Salvando…' : 'Confirmar bloqueio'}
            onPress={handleConfirm}
            disabled={isSaving}
          />
          <Pressable onPress={onCancel} style={s.cancelBtn} accessibilityRole="button" accessibilityLabel="Cancelar">
            <Text style={s.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
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
});
