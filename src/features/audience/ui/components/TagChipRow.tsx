import { View, Text } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  label:  string;
  tags:   string[];
  accentColor?: string;
};

// Fileira de tags somente-leitura (gêneros/comodidades/instrumentos) —
// reaproveitada por EstablishmentDetailScreen e FanProfileScreen.
const useStyles = makeStyles((colors) => ({
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
}));

export function TagChipRow({ label, tags, accentColor }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  // Default no CORPO: na assinatura ele é avaliado fora do escopo do hook.
  const accent = accentColor ?? colors.brand.primary;
  if (tags.length === 0) return null;

  return (
    <View style={s.root}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        {tags.map((tag) => (
          <View key={tag} style={[s.chip, { borderColor: `${accent}40` }]}>
            <Text style={[s.chipText, { color: accent }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
