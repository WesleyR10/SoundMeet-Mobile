import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';

type Props = {
  value:    number | null;
  onChange: (value: number | null) => void;
};

const PRESETS = [5, 10, 20, 50];

// Seletor de valor da gorjeta (TipMusicianScreen, Bloco 11.10) — accent coral
// (energia/gorjeta, ver design-system.md "usage by context").
export function TipAmountSelector({ value, onChange }: Props) {
  const [customText, setCustomText] = useState('');
  const isCustomActive = value !== null && !PRESETS.includes(value);

  function handlePreset(amount: number) {
    setCustomText('');
    onChange(amount);
  }

  function handleCustomChange(text: string) {
    const sanitized = text.replace(/[^0-9,]/g, '');
    setCustomText(sanitized);
    const parsed = Number(sanitized.replace(',', '.'));
    onChange(sanitized && !Number.isNaN(parsed) && parsed > 0 ? parsed : null);
  }

  return (
    <View style={s.root}>
      <View style={s.presetsRow}>
        {PRESETS.map((amount) => (
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
          placeholder="Outro valor"
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

const s = StyleSheet.create({
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
});
