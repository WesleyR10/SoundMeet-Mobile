import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';

type Props = {
  value:    number | null;
  onChange: (value: number | null) => void;
  // Reaproveitado pelo destaque do pedido, cujos valores partem do piso de
  // R$2 (config `REQUEST_BOOST_MIN_AMOUNT`) — a gorjeta avulsa segue com os
  // presets originais.
  presets?: readonly number[];
  // Abaixo disso o valor não é aceito. `null` no `onChange`, e não um número
  // inválido: quem chama decide se desabilita o botão.
  minimum?: number;
  placeholder?: string;
};

const DEFAULT_PRESETS = [5, 10, 20, 50];

// Seletor de valor da gorjeta (TipMusicianScreen, Bloco 11.10) — accent coral
// (energia/gorjeta, ver design-system.md "usage by context").
const useStyles = makeStyles((colors) => ({
  root: { gap: spacing.md },
  presetsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  customBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.xs,
    height:             52,
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:   'rgba(255,255,255,0.04)',
    paddingHorizontal:  spacing.md,
  },
  customBoxActive: {
    borderColor:     colors.accent.coral,
    backgroundColor: `${colors.accent.coral}14`,
  },
  customPrefix: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  customInput: {
    flex: 1,
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
}));

export function TipAmountSelector({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  minimum = 0,
  placeholder = 'Outro valor',
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [customText, setCustomText] = useState('');
  const isCustomActive = value !== null && !presets.includes(value);

  function handlePreset(amount: number) {
    setCustomText('');
    onChange(amount);
  }

  function handleCustomChange(text: string) {
    const sanitized = text.replace(/[^0-9,]/g, '');
    setCustomText(sanitized);
    const parsed = Number(sanitized.replace(',', '.'));
    const isValid =
      !!sanitized && !Number.isNaN(parsed) && parsed > 0 && parsed >= minimum;
    onChange(isValid ? parsed : null);
  }

  return (
    <View style={s.root}>
      <View style={s.presetsRow}>
        {presets.map((amount) => (
          <MultiSelectChip
            key={amount}
            label={`R$ ${amount}`}
            selected={value === amount}
            accentColor={colors.accent.coral}
            onPress={() => handlePreset(amount)}
          />
        ))}
      </View>

      <View style={[s.customBox, isCustomActive && s.customBoxActive]}>
        <Text style={s.customPrefix}>R$</Text>
        <TextInput
          value={customText}
          onChangeText={handleCustomChange}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          keyboardType="decimal-pad"
          style={s.customInput}
          cursorColor={colors.accent.coral}
          selectionColor={`${colors.accent.coral}66`}
          accessibilityLabel="Valor personalizado da gorjeta"
        />
      </View>
    </View>
  );
}
