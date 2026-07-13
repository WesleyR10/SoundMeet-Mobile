import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  label:  string;
  tags:   string[];
  accentColor?: string;
};

// Fileira de tags somente-leitura (gêneros/comodidades/instrumentos) —
// reaproveitada por EstablishmentDetailScreen e FanProfileScreen.
export function TagChipRow({ label, tags, accentColor = colors.brand.primary }: Props) {
  if (tags.length === 0) return null;

  return (
    <View style={s.root}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        {tags.map((tag) => (
          <View key={tag} style={[s.chip, { borderColor: `${accentColor}40` }]}>
            <Text style={[s.chipText, { color: accentColor }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: spacing.sm },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:         colors.text.muted,
  },
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical:    spacing.xs,
    borderRadius:       radius.full,
    borderWidth:         1,
    backgroundColor:   'rgba(255,255,255,0.03)',
  },
  chipText: {
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
  },
});
