import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  title: string;
  items: string[];
  color: string;
};

// Pílulas somente-leitura para instrumentos/gêneros no ViewProfileScreen —
// distinto do MultiSelectChip (interativo, usado no EditProfileScreen/wizard).
export function ProfileTagPills({ title, items, color }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={s.root}>
      <Text style={s.label}>{title}</Text>
      <View style={s.row}>
        {items.map((label) => (
          <View key={label} style={[s.pill, { borderColor: `${color}66`, backgroundColor: `${color}1F` }]}>
            <Text style={[s.pillText, { color }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    color:          'rgba(255,255,255,0.55)',
    textTransform:  'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  pill: {
    borderWidth:        1,
    borderRadius:       radius.full,
    paddingVertical:    spacing.xs,
    paddingHorizontal:  spacing.md,
  },
  pillText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
  },
});
