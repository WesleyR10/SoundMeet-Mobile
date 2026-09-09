import { View, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { GlowCard } from '@/shared/components/GlowCard';

// O mockup mostra "5 estabelecimentos viram seu perfil" com sparkline
// animada — não existe endpoint de analytics de visualização de perfil em
// nenhum módulo do backend (establishments/musicians). Teaser estático, sem
// sparkline nem número fabricado (ver plano — não inventar dado).
const useStyles = makeStyles((colors) => ({
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.title, color: colors.text.primary },
  body:  { ...typography.body, color: colors.text.secondary },
}));

export function DiscoveryCard() {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <GlowCard accentColor={colors.accent.violet} riseDelay={140}>
      <View style={s.row}>
        <Sparkles size={20} color={colors.accent.violet} />
        <Text style={s.title}>Descoberta</Text>
      </View>
      <Text style={s.body}>Em breve: veja quem descobriu seu perfil.</Text>
    </GlowCard>
  );
}
