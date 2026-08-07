import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

export type ChordInstrument = 'guitar' | 'piano';

type Props = {
  value:    ChordInstrument;
  onChange: (value: ChordInstrument) => void;
};

// Seletor Violão | Teclado — mesmo padrão visual de segmentRow/segment em
// InviteMemberSheet.tsx (papel Membro/Líder), reaproveitado aqui pra
// consistência entre sheets do app.
export function InstrumentToggle({ value, onChange }: Props) {
  return (
    <View style={s.segmentRow}>
      <Pressable
        onPress={() => onChange('guitar')}
        style={[s.segment, value === 'guitar' && s.segmentActive]}
        accessibilityRole="button"
        accessibilityLabel="Violão"
        accessibilityState={{ selected: value === 'guitar' }}
      >
        <Text style={[s.segmentLabel, value === 'guitar' && s.segmentLabelActive]}>Violão</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('piano')}
        style={[s.segment, value === 'piano' && s.segmentActive]}
        accessibilityRole="button"
        accessibilityLabel="Teclado"
        accessibilityState={{ selected: value === 'piano' }}
      >
        <Text style={[s.segmentLabel, value === 'piano' && s.segmentLabelActive]}>Teclado</Text>
      </Pressable>
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
    minWidth:       96,
    height:         48,
    paddingHorizontal: spacing.md,
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
