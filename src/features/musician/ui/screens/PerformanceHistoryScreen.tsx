import { FlatList, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, Disc3 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import type { RootScreenProps } from '@/navigation/types';
import type { Performance } from '@/shared/services/performance/performance.types';
import { usePerformanceHistory } from '../../application/usePerformance';

type Props = RootScreenProps<'PerformanceHistory'>;

/** Shows encerrados — cada linha abre o relatório pós-show daquele set. */
export function PerformanceHistoryScreen({ navigation }: Props) {
  const { data, isPending, isError, refetch, isRefetching } = usePerformanceHistory();

  function renderItem({ item }: { item: Performance }) {
    return (
      <Pressable
        onPress={() =>
          navigation.navigate('PerformanceReport', { performanceId: item.id })
        }
        style={s.row}
        accessibilityRole="button"
        accessibilityLabel={`Relatório do show de ${formatDate(item.started_at)}`}
      >
        <View style={s.rowIcon}>
          <Disc3 size={18} color={colors.brand.primary} />
        </View>

        <View style={s.rowInfo}>
          <Text style={s.rowTitle}>{formatDate(item.started_at)}</Text>
          <Text style={s.rowSubtitle}>
            {item.songs_count} {item.songs_count === 1 ? 'música' : 'músicas'}
            {item.duration_seconds !== null && ` · ${formatHours(item.duration_seconds)}`}
          </Text>
        </View>

        <ChevronRight size={18} color={colors.text.muted} />
      </Pressable>
    );
  }

  if (isPending) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <Text style={s.title}>Meus shows</Text>

      {isError ? (
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos carregar seu histórico." />
        </View>
      ) : (data?.items.length ?? 0) === 0 ? (
        <View style={s.center}>
          <Disc3 size={52} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Nenhum show registrado</Text>
          <Text style={s.emptyText}>
            Abra o show na tela Ao Vivo antes de começar a tocar — é isso que
            gera o relatório e alimenta seu currículo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data!.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day:     '2-digit',
    month:   'long',
    year:    'numeric',
  });
}

function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h${String(minutes).padStart(2, '0')}` : `${minutes} min`;
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  title: {
    ...typography.displayMd,
    color:             colors.text.primary,
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  center: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.bodySm,
    color:     colors.text.muted,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.md,
  },
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.md,
    padding:         spacing.lg,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
  },
  rowIcon: {
    width:           40,
    height:          40,
    borderRadius:    radius.full,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.brand.muted,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  rowSubtitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
