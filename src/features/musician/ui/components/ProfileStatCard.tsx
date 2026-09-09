import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  icon:         LucideIcon;
  value:        string;
  label:        string;
  accentColor?: string;
};

const useStyles = makeStyles((colors) => ({
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
}));

export function ProfileStatCard({ icon: Icon, value, label, accentColor }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  // Default no CORPO: na assinatura ele é avaliado fora do escopo do hook.
  const accent = accentColor ?? colors.brand.primary;
  return (
    <View style={[s.card, { borderColor: `${accent}40` }]}>
      <View style={[s.iconBox, { backgroundColor: `${accent}24` }]}>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={s.value} numberOfLines={1}>{value}</Text>
      <Text style={s.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}
