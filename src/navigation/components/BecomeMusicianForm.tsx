import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { completeCadastroSchema } from '@/features/auth/domain/auth.validation';
import { formatCpf, stripDigits } from '@/shared/utils/cpf';
import { formatPhoneBr } from '@/shared/utils/phone';

type Props = {
  submitting: boolean;
  onSubmit:   (values: { cpf: string; phone: string }) => void;
};

// Mini-form do CTA "Quero ser Músico também" (10.5.2) — CPF/celular
// obrigatórios (anti multi-conta, mesma regra do cadastro). Zod-only, sem
// react-hook-form: 2 campos com submit próprio dentro de um bottom sheet,
// mesmo racional dos steps do wizard (ver CLAUDE.md, seção Formulários).
export function BecomeMusicianForm({ submitting, onSubmit }: Props) {
  const [cpf, setCpf]     = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ cpf?: string; phone?: string }>({});

  const handleSubmit = () => {
    const result = completeCadastroSchema.safeParse({ cpf, phone });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({ cpf: fieldErrors.cpf?.[0], phone: fieldErrors.phone?.[0] });
      return;
    }
    setErrors({});
    onSubmit({ cpf: stripDigits(cpf), phone: stripDigits(phone) });
  };

  return (
    <View style={s.root}>
      <FormField
        label="CPF"
        value={cpf}
        onChangeText={(v) => setCpf(formatCpf(v))}
        placeholder="000.000.000-00"
        keyboardType="number-pad"
        error={errors.cpf}
      />
      <FormField
        label="Celular"
        value={phone}
        onChangeText={(v) => setPhone(formatPhoneBr(v))}
        placeholder="(11) 99999-9999"
        keyboardType="phone-pad"
        error={errors.phone}
      />
      <PrimaryButton
        label="Criar conta de músico"
        onPress={handleSubmit}
        loading={submitting}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap:               spacing.md,
    padding:           spacing.lg,
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:       colors.border.default,
    backgroundColor:   colors.bg.surface,
  },
});
