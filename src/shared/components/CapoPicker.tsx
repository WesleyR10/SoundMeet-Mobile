import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  value:    number | null; // null = sem capotraste
  onChange: (value: number | null) => void;
  frets?:   number;
};

// Fileira horizontal de casas (1..frets) + opção "Sem" — mesma ideia da
// lista de capotraste do CifraClub (imagem de referência), num formato mais
// compacto/rolável, pra caber dentro do ChordSheetControlsSheet sem precisar
// de um segundo bottom sheet empilhado.
export function CapoPicker({ value, onChange, frets = 12 }: Props) {
  const options: (number | null)[] = [null, ...Array.from({ length: frets }, (_, i) => i + 1)];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {options.map((fret) => {
        const active = fret === value;
        return (
          <Pressable
            key={fret ?? 'off'}
            onPress={() => onChange(fret)}
            style={[s.chip, active && s.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={fret === null ? 'Sem capotraste' : `Capotraste na ${fret}ª casa`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.chipLabel, active && s.chipLabelActive]}>{fret === null ? 'Sem' : fret}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:            spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    minWidth:          44,
    height:            44,
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
