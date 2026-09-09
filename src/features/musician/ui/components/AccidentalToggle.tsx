import { View, Text, Pressable } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import type { PreferredAccidental } from '../../domain/personal-chord-sheet.types';

type Props = {
  value:    PreferredAccidental;
  onChange: (value: PreferredAccidental) => void;
};

const OPTIONS: { value: PreferredAccidental; label: string }[] = [
  { value: 'auto',  label: 'Automático' },
  { value: 'sharp', label: '♯ Sustenido' },
  { value: 'flat',  label: '♭ Bemol' },
];

// "Automático" deixa o backend decidir por tonalidade (mesma heurística de
// shouldPreferFlatsForKey em chord-transpose.ts); os outros dois forçam a
// grafia mesmo contra a convenção da tonalidade.
const useStyles = makeStyles((colors) => ({
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
    paddingHorizontal: spacing.xs,
    alignItems:     'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.brand.muted,
  },
  segmentLabel: {
    ...typography.bodySm,
    fontSize: 12,
    color:    colors.text.secondary,
  },
  segmentLabelActive: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
}));

export function AccidentalToggle({ value, onChange }: Props) {
  const s = useStyles();
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
