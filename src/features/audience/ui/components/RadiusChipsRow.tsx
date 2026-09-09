import { View, Text, Pressable } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

type Props = {
  radiusKm:       number | null;
  locationDenied: boolean;
  onSelect:       (value: number) => void;
};

// Chips "perto de mim" (7.13a/7.13c) — extraído do FanExploreScreen ao
// ganhar a aba de músicos; mesma linha serve às duas buscas.
const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.sm,
    paddingHorizontal:  spacing.xl,
    paddingBottom:      spacing.md,
  },
  chip: {
    minHeight:          32,
    paddingHorizontal:  spacing.md,
    justifyContent:    'center',
    borderRadius:       radius.full,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.03)',
  },
  chipSelected: {
    borderColor:     colors.brand.primary,
    backgroundColor: colors.brand.muted,
  },
  chipText: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.brand.primary,
  },
  denied: {
    ...typography.caption,
    color: colors.status.warning,
  },
}));

export function RadiusChipsRow({ radiusKm, locationDenied, onSelect }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <MapPin size={14} color={radiusKm ? colors.brand.primary : colors.text.muted} />
      {RADIUS_OPTIONS.map((value) => {
        const selected = radiusKm === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[s.chip, selected && s.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Raio de ${value} quilômetros`}
          >
            <Text style={[s.chipText, selected && s.chipTextSelected]}>{value} km</Text>
          </Pressable>
        );
      })}
      {locationDenied && <Text style={s.denied}>Permita a localização</Text>}
    </View>
  );
}
