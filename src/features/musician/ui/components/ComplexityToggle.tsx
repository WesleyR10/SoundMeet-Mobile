import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { ChordComplexity } from '../../domain/personal-chord-sheet.types';

type Props = {
  value:    ChordComplexity;
  onChange: (value: ChordComplexity) => void;
};

const OPTIONS: { value: ChordComplexity; label: string }[] = [
  { value: 'full',   label: 'Completa' },
  { value: 'simple', label: 'Simples' },
  { value: 'basic',  label: 'Básica' },
];

// Mesmo padrão visual de segmentRow/segment do InstrumentToggle, com 3
// opções em vez de 2 — espelha ChordSymbol.simplify() do backend (full =
// como veio; simple = tira extensões/alterações; basic = só a tríade).
export function ComplexityToggle({ value, onChange }: Props) {
  return (
    <View style={s.segmentRow}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[s.segment, active && s.segmentActive]}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.segmentLabel, active && s.segmentLabelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    borderRadius:  radius.lg,
    borderWidth:    1,
    borderColor:   colors.border.default,
    overflow:      'hidden',
  },
  segment: {
    flex:           1,
    height:         48,
    paddingHorizontal: spacing.sm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.brand.muted,
  },
  segmentLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  segmentLabelActive: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
});
