import { View, Text } from 'react-native';
import { Star, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { AnimatedCounter } from '@/shared/components/AnimatedCounter';
import { ProfileStatCard } from './ProfileStatCard';
import type { MusicianAnalytics } from '../../domain/analytics.types';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { withAlpha } from '@/shared/design-system/withAlpha';

type Props = {
  analytics: MusicianAnalytics;
};

// Linha de 3 stats: nota média via ProfileStatCard (Bloco 2, sem alteração —
// valor com 1 casa decimal, não é uma contagem inteira). Aceitos/rejeitados
// via AnimatedStatCard (abaixo), mesmo visual do ProfileStatCard mas com
// AnimatedCounter (count-up) no lugar de <Text> estático.
export function AnalyticsHeroStats({ analytics }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <ProfileStatCard
        icon={Star}
        value={analytics.average_rating.toFixed(1)}
        label={`${analytics.total_ratings} avaliações`}
        accentColor={colors.brand.primary}
      />
      <AnimatedStatCard
        icon={CheckCircle2}
        value={analytics.accepted_requests_count}
        label="Aceitos"
        accentColor={colors.status.success}
      />
      <AnimatedStatCard
        icon={XCircle}
        value={analytics.rejected_requests_count}
        label="Rejeitados"
        accentColor={colors.status.error}
      />
    </View>
  );
}

function AnimatedStatCard({
  icon: Icon, value, label, accentColor,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  accentColor: string;
}) {
  const s = useStyles();
  return (
    <View style={[s.card, { borderColor: `${accentColor}40` }]}>
      <View style={[s.iconBox, { backgroundColor: `${accentColor}24` }]}>
        <Icon size={18} color={accentColor} strokeWidth={2.2} />
      </View>
      <AnimatedCounter value={value} style={s.value} />
      <Text style={s.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: withAlpha(colors.text.primary, 0.03),
    padding: spacing.md,
    gap: spacing.xs,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
