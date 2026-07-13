import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  icon:         LucideIcon;
  value:        string;
  label:        string;
  accentColor?: string;
};

// Mesmo padrão visual de ProfileStatCard (musician feature) — cópia
// intencional, não import (FSD: nunca cruzar features).
export function PublicStatCard({ icon: Icon, value, label, accentColor = colors.brand.primary }: Props) {
  return (
    <View style={[s.card, { borderColor: `${accentColor}40` }]}>
      <View style={[s.iconBox, { backgroundColor: `${accentColor}24` }]}>
        <Icon size={18} color={accentColor} strokeWidth={2.2} />
      </View>
      <Text style={s.value} numberOfLines={1}>{value}</Text>
      <Text style={s.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex:               1,
    borderRadius:       radius.lg,
    borderWidth:         1,
    backgroundColor:    'rgba(255,255,255,0.03)',
    padding:             spacing.md,
    gap:                 spacing.xs,
  },
  iconBox: {
    width:            34,
    height:           34,
    borderRadius:     radius.md,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:     spacing.xs,
  },
  value: {
    ...typography.title,
    color: colors.text.primary,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
