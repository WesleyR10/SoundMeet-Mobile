import { useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SearchX } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import type { FanStackScreenProps } from '@/navigation/types';
import { useEstablishments } from '../../application/useEstablishments';
import type { EstablishmentFilter } from '../../domain/establishment.types';
import { SearchBar } from '../components/SearchBar';
import { FilterSheet } from '../components/FilterSheet';
import { EstablishmentCard } from '../components/EstablishmentCard';
import { EmptyState } from '../components/EmptyState';

type Props = FanStackScreenProps<'FanExplore'>;

function countActiveFilters(filter: EstablishmentFilter): number {
  let count = 0;
  if (filter.location_city) count += 1;
  if (filter.preferred_genres?.length) count += 1;
  if (filter.amenities?.length) count += 1;
  if (filter.is_verified) count += 1;
  return count;
}

// Busca & filtro (Bloco 11.4) — sobre GET /establishments; sem raio
// geográfico ainda (ver soundmeet-backend/Docs/roadmap.md Bloco 7.13).
export function FanExploreScreen({ navigation }: Props) {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<EstablishmentFilter>({});
  const [sheetVisible, setSheetVisible] = useState(false);

  const queryFilter = useMemo(() => ({ ...filter, name: search || undefined }), [filter, search]);
  const { data, isPending, isRefetching, refetch } = useEstablishments({ per_page: 20, filter: queryFilter });

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Text style={s.title}>Explorar</Text>
      </View>

      <View style={s.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onPressFilter={() => setSheetVisible(true)}
          activeFilterCount={countActiveFilters(filter)}
          placeholder="Buscar por nome..."
        />
      </View>

      {isPending ? (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum resultado encontrado"
          subtitle="Tente ajustar a busca ou os filtros aplicados."
        />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <EstablishmentCard
              establishment={item}
              onPress={() => navigation.navigate('EstablishmentDetail', { establishmentId: item.id })}
            />
          )}
        />
      )}

      <FilterSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        filter={filter}
        onApply={setFilter}
      />
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
    paddingBottom:     spacing.md,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.md,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
