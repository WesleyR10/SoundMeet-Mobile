import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Search } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonList } from '@/shared/components/Skeleton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useCifraSearch } from '../../application/useCifraSearch';
import { useStartCifraAnalysis, useCifraAnalysisJob, getCifraAnalysisErrorMessage } from '../../application/useCifraAnalysisJob';
import { useAddSong, getRepertoireMutationErrorMessage } from '../../application/useRepertoireMutations';
import { CifraSearchResultCard } from '../components/CifraSearchResultCard';
import { CifraAnalysisProgressCard } from '../components/CifraAnalysisProgressCard';
import type { CifraSearchResult } from '../../domain/cifra-search.types';
import type { RepertoireScreenProps } from '@/navigation/types';

type Props = RepertoireScreenProps<'CifraSearch'>;

// Fluxo: buscar por título/artista → escolher candidato → cria item na
// MusicLibrary + dispara análise → poll até completed/failed → "adicionar ao
// repertório". Ver plano Bloco 7 pro porquê da ordem create-then-analyze
// (from-provider/analyses não cria o item sozinho fora do fluxo de preload).
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  headerBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  searchWrap: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.sm,
    marginHorizontal:    spacing.xl,
    height:              48,
    borderRadius:        radius.md,
    borderWidth:          1,
    borderColor:         colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.04)',
    paddingHorizontal:   spacing.md,
    marginBottom:        spacing.lg,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  banner: {
    marginHorizontal: spacing.xl,
    marginBottom:      spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
  centerRoot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    padding:          spacing.xl,
  },
  hintText: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
}));

export function CifraSearchScreen({ navigation, route }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { repertoireId } = route.params;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ result: CifraSearchResult; musicLibraryId: string; jobId: string } | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);

  const { data: results, isPending: isSearching, isError: searchFailed } = useCifraSearch(musicianId, query);
  const startAnalysis = useStartCifraAnalysis(musicianId);
  const { data: job } = useCifraAnalysisJob(selected?.jobId ?? null);
  const addSongMutation = useAddSong(musicianId, repertoireId);

  async function onSelectResult(result: CifraSearchResult) {
    setFlowError(null);
    try {
      const { musicLibraryId, job: startedJob } = await startAnalysis.mutateAsync(result);
      setSelected({ result, musicLibraryId, jobId: startedJob.id });
    } catch (err) {
      setFlowError(getCifraAnalysisErrorMessage(err));
    }
  }

  async function onAddToRepertoire() {
    if (!selected) return;
    setFlowError(null);
    try {
      await addSongMutation.mutateAsync(selected.musicLibraryId);
      navigation.navigate('RepertoireDetail', { repertoireId });
    } catch (err) {
      setFlowError(getRepertoireMutationErrorMessage(err));
    }
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Adicionar música</Text>
      </View>

      {selected ? (
        <CifraAnalysisProgressCard
          result={selected.result}
          job={job}
          flowError={flowError}
          isAdding={addSongMutation.isPending}
          onAddToRepertoire={onAddToRepertoire}
          onRetry={() => setSelected(null)}
        />
      ) : (
        <>
          <View style={s.searchWrap}>
            <Search size={18} color={colors.text.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por título ou artista"
              placeholderTextColor={colors.text.muted}
              style={s.searchInput}
              cursorColor={colors.brand.primary}
              selectionColor={`${colors.brand.primary}66`}
              autoCapitalize="none"
              accessibilityLabel="Buscar cifra"
            />
          </View>

          {!!flowError && <ErrorBanner message={flowError} style={s.banner} />}

          {/* A dica vem ANTES do loading de propósito: a query fica
              `enabled: false` enquanto a busca tem menos de 2 letras, e no
              TanStack Query v5 uma query desabilitada nunca sai de `isPending`
              (que significa "sem dados", não "buscando"). Com o loading em
              cima, a tela abria num spinner eterno e esta dica era inalcançável. */}
          {query.trim().length < 2 ? (
            <View style={s.centerRoot}>
              <Text style={s.hintText}>Digite pelo menos 2 letras pra buscar.</Text>
            </View>
          ) : isSearching ? (
            <View style={s.listContent}>
              <SkeletonList count={4} itemHeight={96} />
            </View>
          ) : searchFailed ? (
            // Sem este ramo, uma busca que falha cai no "Nenhum resultado
            // encontrado" abaixo e o músico procura outra música achando que
            // essa não existe.
            <View style={s.centerRoot}>
              <Text style={s.hintText}>Não conseguimos buscar agora. Confira a conexão e tente de novo.</Text>
            </View>
          ) : (results ?? []).length === 0 ? (
            <View style={s.centerRoot}>
              <Text style={s.hintText}>Nenhum resultado encontrado.</Text>
            </View>
          ) : (
            <FlatList<CifraSearchResult>
              data={results}
              keyExtractor={(item) => item.youtube_video_id}
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => (
                <CifraSearchResultCard result={item} onPress={() => onSelectResult(item)} />
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
