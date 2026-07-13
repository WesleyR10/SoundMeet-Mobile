import { View, Text, StyleSheet } from 'react-native';
import { CalendarClock } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';

// Sem endpoint real de "próximo booking confirmado" — BookingsController
// (scheduling-module) só expõe propose/confirm/cancel, sem GET/listagem;
// CalendarController só tem free-busy/month-slots anonimizados, sem nome de
// venue. Estado vazio até o backend expor isso (ver
// soundmeet-backend/Docs/roadmap.md, Bloco 7/scheduling) — estruturado pra
// plugar um useNextBooking() real no lugar deste estado fixo quando existir.
export function NextShowCard() {
  return (
    <GlowCard accentColor={colors.accent.violet} riseDelay={80}>
      <View style={s.row}>
        <CalendarClock size={20} color={colors.accent.violet} />
        <Text style={s.title}>Próximo Show</Text>
      </View>
      <Text style={s.body}>Nenhum show confirmado no momento.</Text>
      <Text style={s.sub}>A agenda de shows chega em breve.</Text>
    </GlowCard>
  );
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.title, color: colors.text.primary },
  body:  { ...typography.body, color: colors.text.secondary },
  sub:   { ...typography.caption, color: colors.text.muted },
});
