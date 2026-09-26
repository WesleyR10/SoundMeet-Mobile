import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { radius, spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';

type Props = {
  accepting: boolean;
  rejecting: boolean;
  onAccept:  () => void;
  onReject:  (reason: string) => void;
  onLater:   () => void;
};

/*
 * Resposta a um convite SEM termos. "Tenho interesse", e não "Aceitar
 * proposta": não há data nem cachê para aceitar — ver `inquiryDecisionMode`.
 * O estado do motivo é local: o sheet remonta este componente por proposta.
 */
const useStyles = makeStyles((colors) => ({
  actions:    { gap: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  fullWidth:  { width: '100%' },
  declineBtn: {
    width:          '100%',
    height:         48,
    borderRadius:   radius.xl,
    borderWidth:    1,
    borderColor:    colors.border.strong,
    alignItems:     'center',
    justifyContent: 'center',
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
}));

export function InquiryInterestActions({ accepting, rejecting, onAccept, onReject, onLater }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [askingReason, setAskingReason] = useState(false);
  const [reason, setReason] = useState('');
  const busy = accepting || rejecting;

  if (askingReason) {
    return (
      <View style={s.actions}>
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
          onPress={() => onReject(reason)}
          loading={rejecting}
          style={s.fullWidth}
        />
        <Pressable
          onPress={() => setAskingReason(false)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={8}
        >
          <Text style={s.laterLabel}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.actions}>
      <PrimaryButton label="Tenho interesse" onPress={onAccept} loading={accepting} style={s.fullWidth} />
      <Pressable
        onPress={() => setAskingReason(true)}
        disabled={busy}
        style={s.declineBtn}
        accessibilityRole="button"
        accessibilityLabel="Recusar convite"
      >
        <Text style={s.declineLabel}>Recusar</Text>
      </Pressable>
      <Pressable onPress={onLater} accessibilityRole="button" accessibilityLabel="Decidir depois" hitSlop={8}>
        <Text style={s.laterLabel}>Decidir depois</Text>
      </Pressable>
    </View>
  );
}
