import { useMemo, useState, type ReactElement } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SearchX } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import type { FanStackScreenProps } from '@/navigation/types';
import { useEstablishments } from '../../application/useEstablishments';
import { useMusiciansSearch } from '../../application/useMusiciansSearch';
import type { Establishment, EstablishmentFilter } from '../../domain/establishment.types';
import type { MusicianPublic } from '../../domain/musician-public.types';
import { SearchBar } from '../components/SearchBar';
import { FilterSheet } from '../components/FilterSheet';
import { EstablishmentCard } from '../components/EstablishmentCard';
import { MusicianResultCard } from '../components/MusicianResultCard';
import { ExploreModeToggle, type ExploreMode } from '../components/ExploreModeToggle';
import { RadiusChipsRow } from '../components/RadiusChipsRow';
import { EmptyState } from '../components/EmptyState';
import { useUserLocation } from '@/shared/services/location/useUserLocation';
import { haversineKm } from '@/shared/utils/geo';

type Props = FanStackScreenProps<'FanExplore'>;

function countActiveFilters(filter: EstablishmentFilter): number {
  let count = 0;
  if (filter.location_city) count += 1;
  if (filter.preferred_genres?.length) count += 1;
  if (filter.amenities?.length) count += 1;
  if (filter.is_verified) count += 1;
  return count;
}

type Coords = { latitude: number; longitude: number };

function distanceTo(coords: Coords | null, active: boolean, location?: { latitude?: number | null; longitude?: number | null } | null): number | null {
  if (!coords || !active) return null;
  if (location?.latitude === null || location?.latitude === undefined) return null;
  if (location?.longitude === null || location?.longitude === undefined) return null;
  return haversineKm(coords.latitude, coords.longitude, location.latitude, location.longitude);
}

// Busca & filtro (Bloco 11.4) + raio geográfico (7.13a) + músicos (7.13c):
// o toggle Locais | Músicos compartilha SearchBar e chips de raio; só a
// query da aba ativa roda (enabled). FilterSheet segue exclusivo de locais.
export function FanExploreScreen({ navigation }: Props) {
  const [mode, setMode]       = useState<ExploreMode>('places');
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<EstablishmentFilter>({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const { coords, status: locationStatus, request: requestLocation } = useUserLocation();

  const handleSelectRadius = async (value: number) => {
    if (radiusKm === value) {
      setRadiusKm(null);
      return;
    }
    const position = coords ?? (await requestLocation());
    if (position) setRadiusKm(value);
  };

  const geoFilter = useMemo(() => (
    radiusKm !== null && coords
      ? { lat: coords.latitude, lng: coords.longitude, radius_km: radiusKm }
      : {}
  ), [radiusKm, coords]);

  const establishmentsQuery = useEstablishments(
    { per_page: 20, filter: { ...filter, name: search || undefined, ...geoFilter } },
    mode === 'places',
  );
  // Fã busca artista pelo nome artístico (display do app inteiro) — stage_name.
  const musiciansQuery = useMusiciansSearch(
    { per_page: 20, filter: { stage_name: search || undefined, ...geoFilter } },
    mode === 'musicians',
  );

  const activeQuery = mode === 'places' ? establishmentsQuery : musiciansQuery;
  const radiusActive = radiusKm !== null;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Text style={s.title}>Explorar</Text>
      </View>

      <View style={s.toggleWrap}>
        <ExploreModeToggle mode={mode} onChange={setMode} />
      </View>

      <View style={s.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onPressFilter={mode === 'places' ? () => setSheetVisible(true) : undefined}
          activeFilterCount={mode === 'places' ? countActiveFilters(filter) : 0}
          placeholder={mode === 'places' ? 'Buscar por nome...' : 'Buscar músico...'}
        />
      </View>

      <RadiusChipsRow
        radiusKm={radiusKm}
        locationDenied={locationStatus === 'denied'}
        onSelect={handleSelectRadius}
      />

      {activeQuery.isPending ? (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : mode === 'places' ? (
        <ResultList<Establishment>
          items={establishmentsQuery.data?.data ?? []}
          onRefresh={establishmentsQuery.refetch}
          refreshing={establishmentsQuery.isRefetching}
          renderItem={(item) => (
            <EstablishmentCard
              establishment={item}
              distanceKm={distanceTo(coords, radiusActive, item.profile?.location as never)}
              onPress={() => navigation.navigate('EstablishmentDetail', { establishmentId: item.id })}
            />
          )}
        />
      ) : (
        <ResultList<MusicianPublic>
          items={musiciansQuery.data?.data ?? []}
          onRefresh={musiciansQuery.refetch}
          refreshing={musiciansQuery.isRefetching}
          renderItem={(item) => (
            <MusicianResultCard
              musician={item}
              distanceKm={distanceTo(coords, radiusActive, item.profile?.location)}
              onPress={() => navigation.navigate('MusicianPublicProfile', { musicianId: item.id })}
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

function ResultList<T extends { id: string }>({ items, renderItem, onRefresh, refreshing }: {
  items:      T[];
  renderItem: (item: T) => ReactElement;
  onRefresh:  () => void;
  refreshing: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nenhum resultado encontrado"
        subtitle="Tente ajustar a busca ou os filtros aplicados."
      />
    );
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={s.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => renderItem(item)}
    />
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
  toggleWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.md,
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
