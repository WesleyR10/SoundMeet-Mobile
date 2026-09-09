import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, FileMusic, Search } from 'lucide-react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { MusicianTabParamList, RepertoireScreenProps, RootStackParamList } from '@/navigation/types';
import { useMyMusicLibraryItems } from '../../application/useMyMusicLibraryItems';
import { usePersonalChordSheets } from '../../application/usePersonalChordSheets';
import { useForkChordSheet, getPersonalChordSheetMutationErrorMessage } from '../../application/usePersonalChordSheetMutations';
import type { MusicLibraryItem } from '../../domain/music-library.types';
import { MusicLibraryItemPickerCard } from '../components/MusicLibraryItemPickerCard';

type Props = RepertoireScreenProps<'AddPersonalChordSheet'>;

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title, color: colors.text.primary },
  search: {
    height: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.xl, marginBottom: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.surface,
  },
  input: { flex: 1, ...typography.body, color: colors.text.primary },
  error: { marginHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.xs },
  planLink: { ...typography.bodySm, fontFamily: 'Inter-SemiBold', color: colors.brand.primary, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
}));

export function AddPersonalChordSheetScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const library = useMyMusicLibraryItems({ per_page: 50 });
  const personal = usePersonalChordSheets(musicianId, { per_page: 50 });
  const fork = useForkChordSheet(musicianId);
  const tabs = navigation.getParent<BottomTabNavigationProp<MusicianTabParamList>>();
  const root = tabs?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const existing = useMemo(
    () => new Set((personal.data?.data ?? []).map((sheet) => sheet.music_library_id)),
    [personal.data],
  );
  const items = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (library.data?.data ?? []).filter((item) => {
      if (existing.has(item.id)) return false;
      if (!term) return true;
      return `${item.title} ${item.artist}`.toLocaleLowerCase('pt-BR').includes(term);
    });
  }, [library.data, existing, search]);

  async function create(item: MusicLibraryItem) {
    if (!item.has_chord_sheet) return;
    setError(null);
    try {
      const created = await fork.mutateAsync(item.id);
      navigation.replace('PersonalChordSheetEditor', { personalChordSheetId: created.personal_chord_sheet_id });
    } catch (cause) {
      setError(getPersonalChordSheetMutationErrorMessage(cause));
    }
  }

  const pending = library.isPending || personal.isPending;
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Escolher música</Text>
      </View>
      <View style={s.search}>
        <Search size={18} color={colors.text.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar na minha biblioteca" placeholderTextColor={colors.text.muted} style={s.input} />
      </View>
      {!!error && (
        <View style={s.error}>
          <ErrorBanner message={error} />
          <Pressable onPress={() => root?.navigate('Plans')} accessibilityRole="button" accessibilityLabel="Ver planos"><Text style={s.planLink}>Ver planos</Text></Pressable>
        </View>
      )}
      {pending ? (
        <View style={s.list}><SkeletonList count={6} itemHeight={72} /></View>
      ) : library.isError || personal.isError ? (
        <View style={s.center}><ErrorBanner message="Não conseguimos carregar sua biblioteca." /></View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileMusic}
          title="Nenhuma música disponível"
          subtitle="As músicas com fork já criado foram ocultadas. Gere uma cifra no repertório para ela aparecer aqui."
        />
      ) : (
        <FlatList<MusicLibraryItem>
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => <MusicLibraryItemPickerCard item={item} disabled={!item.has_chord_sheet || fork.isPending} onPress={() => create(item)} />}
        />
      )}
    </SafeAreaView>
  );
}
