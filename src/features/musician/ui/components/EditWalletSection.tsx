import { View, StyleSheet } from 'react-native';
import { CreditCard, Smartphone, Mail, KeyRound } from 'lucide-react-native';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { FormField } from '@/shared/components/FormField';
import { colors, spacing } from '@/shared/design-system/tokens';
import type { PixKeyType } from '../../domain/musician.validation';

type Props = {
  pixKeyType:   PixKeyType | null;
  pixKey:       string;
  onChangeType: (type: PixKeyType) => void;
  onChangeKey:  (v: string) => void;
  error?:       string | null;
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

// Mesma lógica/idioma visual de StepFourPix.tsx (chips de tipo + campo de
// chave), reescrito aqui sem o título/subtítulo de wizard-step — o header do
// AccordionSection já cobre esse papel dentro do EditProfileScreen.
export function EditWalletSection({ pixKeyType, pixKey, onChangeType, onChangeKey, error }: Props) {
  return (
    <View style={s.root}>
      <View style={s.chipWrap}>
        {TYPE_OPTIONS.map((opt) => (
          <MultiSelectChip
            key={opt.id}
            label={opt.label}
            icon={opt.icon}
            selected={pixKeyType === opt.id}
            accentColor={colors.accent.coral}
            onPress={() => onChangeType(opt.id)}
          />
        ))}
      </View>

      {!!pixKeyType && (
        <FormField
          label="Chave PIX"
          value={pixKey}
          onChangeText={onChangeKey}
          placeholder={PLACEHOLDER[pixKeyType]}
          keyboardType={KEYBOARD_TYPE[pixKeyType]}
          error={error ?? undefined}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
});
