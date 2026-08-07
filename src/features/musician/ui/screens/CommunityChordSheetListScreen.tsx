import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useQueries } from '@tanstack/react-query';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { isApiError } from '@/shared/services/http/types';
import type { RepertoireScreenProps } from '@/navigation/types';
import { useCommunityChordSheets } from '../../application/useCommunityChordSheets';
import { getMusicLibraryItem } from '../../infrastructure/music-library.api';
import { musicLibraryItemKey } from '../../application/useMusicLibraryItem';
import type { PersonalChordSheetSummary } from '../../domain/personal-chord-sheet.types';
import { CommunityChordSheetCard } from '../components/CommunityChordSheetCard';

type Props = RepertoireScreenProps<'CommunityChordSheetList'>;

export function CommunityChordSheetListScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const query = useCommunityChordSheets({ per_page: 50, sort: 'shared_at', sort_dir: 'desc' });
  const sheets = query.data?.data ?? [];
  const itemQueries = useQueries({
    queries: sheets.map((sheet) => ({
      queryKey: musicLibraryItemKey(sheet.music_library_id),
      queryFn: () => getMusicLibraryItem(sheet.music_library_id),
      staleTime: Infinity,
    })),
  });
  const visibleSheets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return sheets;
    return sheets.filter((_sheet, index) => {
      const item = itemQueries[index]?.data;
      return `${item?.title ?? ''} ${item?.artist ?? ''}`.toLocaleLowerCase('pt-BR').includes(term);
    });
  }, [sheets, itemQueries, search]);
  const unavailable = query.isError && isApiError(query.error) && query.error.response?.status === 404;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title}>Comunidade de Cifras</Text>
          <Text style={s.subtitle}>Correções compartilhadas por músicos</Text>
        </View>
      </View>
      <View style={s.search}>
        <Search size={18} color={colors.text.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar música ou artista" placeholderTextColor={colors.text.muted} style={s.input} />
      </View>

      {query.isPending ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent.violetLight} /></View>
      ) : unavailable ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Comunidade temporariamente indisponível</Text>
          <Text style={s.emptyText}>Suas cifras pessoais continuam disponíveis normalmente.</Text>
        </View>
      ) : query.isError ? (
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos carregar a comunidade." />
          <Pressable onPress={() => query.refetch()}><Text style={s.retry}>Tentar novamente</Text></Pressable>
        </View>
      ) : visibleSheets.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>{search ? 'Nenhum resultado' : 'A comunidade está começando'}</Text>
          <Text style={s.emptyText}>{search ? 'Tente outro título ou artista.' : 'Quando músicos publicarem suas versões, elas aparecerão aqui.'}</Text>
        </View>
      ) : (
        <FlatList<PersonalChordSheetSummary>
          data={visibleSheets}
          keyExtractor={(item) => item.personal_chord_sheet_id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item, index }) => (
            <CommunityChordSheetCard sheet={item} riseDelay={index * 50} onPress={() => navigation.navigate('CommunityChordSheetDetail', { personalChordSheetId: item.personal_chord_sheet_id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, gap: 1 },
  title: { ...typography.title, color: colors.text.primary },
  subtitle: { ...typography.caption, color: colors.text.secondary },
  search: {
    height: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.surface,
  },
  input: { flex: 1, ...typography.body, color: colors.text.primary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  retry: { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.brand.primary },
  emptyTitle: { ...typography.title, color: colors.text.primary, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
