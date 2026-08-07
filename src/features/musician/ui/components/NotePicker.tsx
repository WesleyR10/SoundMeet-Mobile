import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

type Props = {
  value:        string | null;
  onChange:     (note: string | null) => void;
  preferFlats?: boolean;
  // Quando true, inclui o chip "Nenhuma" no início (usado pro seletor de
  // baixo opcional do ChordPickerSheet — raiz sempre exige uma nota).
  clearable?:   boolean;
};

// Fileira horizontal de 12 notas — mesma técnica de CapoPicker.tsx (chips
// roláveis compactos). Reusado pelo ChordPickerSheet tanto pra escolher a
// raiz do acorde quanto o baixo opcional (slash chord).
export function NotePicker({ value, onChange, preferFlats = false, clearable = false }: Props) {
  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES;
  const options: (string | null)[] = clearable ? [null, ...names] : names;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {options.map((note) => {
        const active = note === value;
        return (
          <Pressable
            key={note ?? 'none'}
            onPress={() => onChange(note)}
            style={[s.chip, active && s.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={note ?? 'Sem baixo'}
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.chipLabel, active && s.chipLabelActive]}>{note ?? 'Nenhuma'}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:  'row',
    gap:             spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    minWidth:          44,
    height:            48,
    borderRadius:      radius.full,
    borderWidth:        1,
    borderColor:       colors.border.default,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.sm,
  },
  chipActive: {
    borderColor:      colors.brand.primary,
    backgroundColor: colors.brand.muted,
  },
  chipLabel: {
    ...typography.bodySm,
    fontFamily: 'JetBrainsMono-Bold',
    color:      colors.text.secondary,
  },
  chipLabelActive: {
    color: colors.brand.primary,
  },
});
