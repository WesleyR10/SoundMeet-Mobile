import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Music2 } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import type { FanStackScreenProps } from '@/navigation/types';
import { useEventPerformers } from '../../application/useEstablishment';
import { PerformerRow } from '../components/PerformerRow';
import { EmptyState } from '../components/EmptyState';

type Props = FanStackScreenProps<'EventPerformers'>;

// Tela nova, descoberta durante a implementação do Bloco 11.5 — sem ela, o
// fã não tinha como escolher PRA QUEM pedir música num evento com mais de um
// performer. Ver nota em navigation/types.ts (FanSharedStackParamList).
export function EventPerformersScreen({ route, navigation }: Props) {
  const { establishmentId, eventId } = route.params;
  const { data, isPending } = useEventPerformers(establishmentId, eventId);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.title}>Quem toca hoje</Text>
        <Text style={s.subtitle}>Escolha um artista pra pedir uma música ou deixar uma gorjeta.</Text>
      </View>

      {isPending ? (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={Music2} title="Nenhum performer escalado ainda" subtitle="O estabelecimento ainda não confirmou quem vai tocar." />
      ) : (
        <View style={s.list}>
          {data.data.map((performer) => (
            <PerformerRow
              key={performer.id}
              performer={performer}
              onPress={(musicianId) => navigation.navigate('MusicianPublicProfile', { musicianId, eventId, establishmentId })}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
    gap:                spacing.xs,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap:                spacing.md,
  },
});
