import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { useTheme } from '@/shared/hooks/useTheme';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { INSTRUMENT_OPTIONS, GENRE_OPTIONS } from '../../domain/musician.constants';

type Props = {
  selectedInstrumentIds: string[];
  onToggleInstrument:    (id: string) => void;
  selectedGenreIds:      string[];
  onToggleGenre:         (id: string) => void;
};

export function EditTagsSection({ selectedInstrumentIds, onToggleInstrument, selectedGenreIds, onToggleGenre }: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.root}>
      <View style={s.group}>
        <View style={s.groupHeader}>
          <Text style={s.label}>Instrumentos</Text>
          <Text style={[s.count, { color: colors.brand.primary }]}>{selectedInstrumentIds.length} selecionado{selectedInstrumentIds.length === 1 ? '' : 's'}</Text>
        </View>
        <View style={s.chips}>
          {INSTRUMENT_OPTIONS.map((opt) => (
            <MultiSelectChip
              key={opt.id}
              label={opt.label}
              icon={opt.icon}
              selected={selectedInstrumentIds.includes(opt.id)}
              onPress={() => onToggleInstrument(opt.id)}
            />
          ))}
        </View>
      </View>

      <View style={s.group}>
        <View style={s.groupHeader}>
          <Text style={s.label}>Gêneros musicais</Text>
          <Text style={[s.count, { color: colors.accent.coral }]}>{selectedGenreIds.length} selecionado{selectedGenreIds.length === 1 ? '' : 's'}</Text>
        </View>
        <View style={s.chips}>
          {GENRE_OPTIONS.map((opt) => (
            <MultiSelectChip
              key={opt.id}
              label={opt.label}
              icon={opt.icon}
              selected={selectedGenreIds.includes(opt.id)}
              accentColor={colors.accent.coral}
              onPress={() => onToggleGenre(opt.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  groupHeader: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    color:          'rgba(255,255,255,0.55)',
    textTransform:  'uppercase',
  },
  count: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  chips: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
});
