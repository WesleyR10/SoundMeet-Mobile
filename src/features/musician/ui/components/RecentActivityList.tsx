import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, PlayCircle } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import type { MusicRequest } from '../../domain/request.types';

type Props = {
  requests:  MusicRequest[];
  isLoading: boolean;
};

function relativeTime(ageInMinutes: number): string {
  if (ageInMinutes < 1) return 'agora';
  if (ageInMinutes < 60) return `há ${Math.round(ageInMinutes)} min`;
  const hours = Math.round(ageInMinutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.round(hours / 24)}d`;
}

// Fonte real: useRequests(musicianId, 'all') já filtrado a is_accepted/
// is_played pelo HomeScreen — não inclui gorjetas/badges/visualizações
// (nenhum feed unificado existe pra esses eventos ainda).
export function RecentActivityList({ requests, isLoading }: Props) {
  return (
    <GlowCard accentColor={colors.brand.primary} riseDelay={200} style={s.card}>
      <Text style={s.title}>Atividade Recente</Text>

      {isLoading ? (
        <Text style={s.empty}>Carregando…</Text>
      ) : requests.length === 0 ? (
        <Text style={s.empty}>Nenhuma atividade recente ainda.</Text>
      ) : (
        <View style={s.list}>
          {requests.map((request) => {
            const Icon = request.is_played ? PlayCircle : CheckCircle2;
            return (
              <View key={request.id} style={s.row}>
                <View style={s.iconBox}>
                  <Icon size={16} color={colors.brand.primary} />
                </View>
                <View style={s.textCol}>
                  <Text style={s.rowTitle} numberOfLines={1}>
                    {request.is_played ? 'Tocada: ' : 'Pedido aceito: '}
                    {request.display_title}
                  </Text>
                  <Text style={s.rowTime}>{relativeTime(request.age_in_minutes)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </GlowCard>
  );
}

const s = StyleSheet.create({
  card:  { gap: spacing.md },
  title: { ...typography.title, color: colors.text.primary },
  empty: { ...typography.body, color: colors.text.secondary },
  list:  { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  iconBox: {
    width:            32,
    height:           32,
    borderRadius:     radius.md,
    backgroundColor: colors.brand.muted,
    alignItems:      'center',
    justifyContent:  'center',
  },
  textCol:  { flex: 1, gap: 2 },
  rowTitle: { ...typography.body, color: colors.text.primary },
  rowTime:  { ...typography.caption, color: colors.text.muted },
});
