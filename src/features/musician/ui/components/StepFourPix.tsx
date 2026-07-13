import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { CreditCard, Smartphone, Mail, KeyRound } from 'lucide-react-native';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { FormField } from '@/shared/components/FormField';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { formatCpf } from '@/shared/utils/cpf';
import { formatPhoneBr } from '@/shared/utils/phone';
import type { PixKeyType } from '../../domain/musician.validation';

type Props = {
  pixKeyType:    PixKeyType | null;
  pixKey:        string;
  onChangeType: (type: PixKeyType) => void;
  onChangeKey:   (v: string) => void;
  prefillCpf?:   string | null;
  prefillPhone?: string | null;
  prefillEmail?: string | null;
  error?:        string | null;
};

const TYPE_OPTIONS: { id: PixKeyType; label: string; icon: typeof CreditCard }[] = [
  { id: 'cpf',    label: 'CPF',      icon: CreditCard },
  { id: 'phone',  label: 'Celular',  icon: Smartphone },
  { id: 'email',  label: 'E-mail',   icon: Mail },
  { id: 'random', label: 'Aleatória', icon: KeyRound },
];

const KEYBOARD_TYPE: Record<PixKeyType, 'number-pad' | 'email-address' | 'default'> = {
  cpf:    'number-pad',
  phone:  'number-pad',
  email:  'email-address',
  random: 'default',
};

const PLACEHOLDER: Record<PixKeyType, string> = {
  cpf:    '000.000.000-00',
  phone:  '(00) 00000-0000',
  email:  'voce@email.com',
  random: 'Cole sua chave aleatória',
};

export function StepFourPix({
  pixKeyType, pixKey, onChangeType, onChangeKey,
  prefillCpf, prefillPhone, prefillEmail, error,
}: Props) {
  const opacity = useSharedValue(0);
  const y       = useSharedValue(16);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 320 });
    y.value       = withTiming(0, { duration: 320 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: y.value }],
  }));

  const handleSelectType = (type: PixKeyType) => {
    onChangeType(type);
    // Re-tocar o mesmo chip já selecionado preserva o que a pessoa já digitou
    // ali. Trocar para um tipo diferente sempre busca o prefill do tipo novo
    // (ou limpa, se não houver) — o texto do tipo anterior não faz sentido
    // pro novo (ex.: um CPF não é uma chave PIX tipo celular válida).
    if (type === pixKeyType) return;

    if (type === 'cpf' && prefillCpf) onChangeKey(formatCpf(prefillCpf));
    else if (type === 'phone' && prefillPhone) onChangeKey(formatPhoneBr(prefillPhone));
    else if (type === 'email' && prefillEmail) onChangeKey(prefillEmail);
    else onChangeKey('');
  };

  const handleChangeKey = (v: string) => {
    if (pixKeyType === 'cpf') onChangeKey(formatCpf(v));
    else if (pixKeyType === 'phone') onChangeKey(formatPhoneBr(v));
    else onChangeKey(v);
  };

  return (
    <Animated.View style={[s.root, animStyle]}>
      <Text style={s.title}>Onde você recebe seus pagamentos?</Text>
      <Text style={s.subtitle}>
        Defina sua chave PIX. É para ela que vai o que você ganha na plataforma — gorjetas do
        público e pagamentos de contratações com estabelecimentos. Sem uma chave, você não recebe.
      </Text>

      <View style={s.chipWrap}>
        {TYPE_OPTIONS.map((opt) => (
          <MultiSelectChip
            key={opt.id}
            label={opt.label}
            icon={opt.icon}
            selected={pixKeyType === opt.id}
            accentColor={colors.accent.coral}
            onPress={() => handleSelectType(opt.id)}
          />
        ))}
      </View>

      {!!pixKeyType && (
        <FormField
          label="Chave PIX"
          value={pixKey}
          onChangeText={handleChangeKey}
          placeholder={PLACEHOLDER[pixKeyType]}
          keyboardType={KEYBOARD_TYPE[pixKeyType]}
          error={error ?? undefined}
        />
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
});
