import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { TunerMode } from '../../domain/tuner.types';

type Props = {
  mode:     TunerMode;
  onChange: (mode: TunerMode) => void;
};

const OPTIONS: { value: TunerMode; label: string }[] = [
  { value: 'guitar',    label: 'Guitarra' },
  { value: 'chromatic', label: 'Cromático' },
];

// Segmented control do afinador — modo guitarra (headstock + cordas, padrão)
// vs cromático (arco + nota, comportamento original do Bloco 8).
export function TunerModeToggle({ mode, onChange }: Props) {
  return (
    <View style={s.root}>
      {OPTIONS.map((option) => {
        const selected = mode === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[s.segment, selected && s.segmentSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Modo ${option.label}`}
          >
            <Text style={[s.label, selected && s.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection:   'row',
    alignSelf:       'center',
    borderRadius:     radius.full,
    borderWidth:       1,
    borderColor:      colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:           3,
  },
  segment: {
    minHeight:          42,
    paddingHorizontal:  spacing.lg,
    alignItems:        'center',
    justifyContent:    'center',
    borderRadius:       radius.full,
  },
  segmentSelected: {
    backgroundColor: colors.brand.muted,
  },
  label: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  labelSelected: {
    color: colors.brand.primary,
  },
});
