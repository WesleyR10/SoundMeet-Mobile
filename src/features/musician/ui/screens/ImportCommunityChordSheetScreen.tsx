import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonList, SkeletonText } from '@/shared/components/Skeleton';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { MusicianTabParamList, RepertoireScreenProps, RootStackParamList } from '@/navigation/types';
import { useCommunityChordSheet } from '../../application/useCommunityChordSheet';
import { useMusicLibraryItem } from '../../application/useMusicLibraryItem';
import { useMyMusicLibraryItems } from '../../application/useMyMusicLibraryItems';
import { useCifraSearch } from '../../application/useCifraSearch';
import {
  useCifraAnalysisJob,
  useStartCifraAnalysis,
  useStartCifraAnalysisForExistingItem,
  getCifraAnalysisErrorMessage,
} from '../../application/useCifraAnalysisJob';
import { useImportCommunityChordSheet, getImportChordSheetErrorMessage } from '../../application/useImportCommunityChordSheet';
import type { CifraSearchResult } from '../../domain/cifra-search.types';
import type { ImportedChordSheet } from '../../domain/personal-chord-sheet.types';
import { CifraSearchResultCard } from '../components/CifraSearchResultCard';
import { CifraAnalysisProgressCard } from '../components/CifraAnalysisProgressCard';
import { ConflictsReviewSheet } from '../components/ConflictsReviewSheet';

type Props = RepertoireScreenProps<'ImportCommunityChordSheet'>;

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 1 },
  title: { ...typography.title, color: colors.text.primary },
  subtitle: { ...typography.caption, color: colors.text.secondary },
  error: { marginHorizontal: spacing.xl, gap: spacing.xs },
  planLink: { ...typography.bodySm, fontFamily: 'Inter-SemiBold', color: colors.brand.primary, textAlign: 'center' },
  instructions: { ...typography.body, color: colors.text.secondary, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  ready: { margin: spacing.xl, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.brand, backgroundColor: colors.bg.surface },
  readyTitle: { ...typography.title, color: colors.text.primary, textAlign: 'center' },
  successTitle: { ...typography.title, color: colors.text.primary },
  centerText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  warning: { ...typography.bodySm, color: colors.status.warning, textAlign: 'center' },
  reviewButton: {
    minHeight: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.brand,
  },
  reviewText: { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.brand.primary },
  fullButton: { alignSelf: 'stretch' },
}));

export function ImportCommunityChordSheetScreen({ navigation, route }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sourceId = route.params.sourcePersonalChordSheetId;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const source = useCommunityChordSheet(sourceId);
  const item = useMusicLibraryItem(source.data?.music_library_id ?? null);
  const mine = useMyMusicLibraryItems({ per_page: 50, title: item.data?.title, artist: item.data?.artist });
  const catalog = useCifraSearch(musicianId, item.data ? `${item.data.title} ${item.data.artist}` : '');
  const startNew = useStartCifraAnalysis(musicianId);
  const startExisting = useStartCifraAnalysisForExistingItem(musicianId);
  const importer = useImportCommunityChordSheet(musicianId);
  const [analysis, setAnalysis] = useState<{ result: CifraSearchResult; targetId: string; jobId: string } | null>(null);
  const [imported, setImported] = useState<ImportedChordSheet | null>(null);
  const [conflictsVisible, setConflictsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const job = useCifraAnalysisJob(analysis?.jobId ?? null);
  const tabs = navigation.getParent<BottomTabNavigationProp<MusicianTabParamList>>();
  const root = tabs?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const existing = useMemo(() => {
    if (!item.data) return null;
    const normalizedTitle = item.data.title.trim().toLocaleLowerCase('pt-BR');
    const normalizedArtist = item.data.artist.trim().toLocaleLowerCase('pt-BR');
    return (mine.data?.data ?? []).find((candidate) =>
      candidate.title.trim().toLocaleLowerCase('pt-BR') === normalizedTitle
      && candidate.artist.trim().toLocaleLowerCase('pt-BR') === normalizedArtist,
    ) ?? null;
  }, [item.data, mine.data]);

  async function selectCatalogResult(result: CifraSearchResult) {
    setError(null);
    try {
      if (existing) {
        const started = await startExisting.mutateAsync({ musicLibraryId: existing.id, result });
        setAnalysis({ result, targetId: existing.id, jobId: started.id });
      } else {
        const started = await startNew.mutateAsync(result);
        setAnalysis({ result, targetId: started.musicLibraryId, jobId: started.job.id });
      }
    } catch (cause) {
      setError(getCifraAnalysisErrorMessage(cause));
    }
  }

  async function importTo(targetId: string) {
    setError(null);
    try {
      setImported(await importer.mutateAsync({ sourceId, targetMusicLibraryId: targetId }));
    } catch (cause) {
      setError(getImportChordSheetErrorMessage(cause));
    }
  }

  if (source.isPending || item.isPending || mine.isPending) {
    return <ScreenState><SkeletonText lines={8} /></ScreenState>;
  }
  if (!source.data || !item.data) {
    return <ScreenState><ErrorBanner message="Não conseguimos preparar esta importação." /></ScreenState>;
  }

  if (imported) {
    return (
      <SafeAreaView style={s.state} edges={['top', 'bottom']}>
        <CheckCircle2 size={48} color={colors.brand.primary} />
        <Text style={s.successTitle}>Cifra importada</Text>
        <Text style={s.centerText}>
          {imported.conflict_count > 0
            ? `${imported.conflict_count} correção(ões) não puderam ser reancoradas e ficaram sinalizadas para revisão.`
            : 'Todas as correções compatíveis foram aplicadas à sua análise.'}
        </Text>
        {imported.base_differs && <Text style={s.warning}>A análise da sua biblioteca difere da análise do autor.</Text>}
        {imported.conflict_count > 0 && (
          <Pressable onPress={() => setConflictsVisible(true)} style={s.reviewButton} accessibilityRole="button" accessibilityLabel="Revisar conflitos">
            <Text style={s.reviewText}>Revisar conflitos</Text>
          </Pressable>
        )}
        <PrimaryButton label="Abrir minha cifra" onPress={() => navigation.replace('PersonalChordSheetEditor', { personalChordSheetId: imported.personal_chord_sheet.personal_chord_sheet_id })} style={s.fullButton} />
        <ConflictsReviewSheet visible={conflictsVisible} outcomes={imported.outcomes} onClose={() => setConflictsVisible(false)} />
      </SafeAreaView>
    );
  }

  const targetReady = existing?.has_chord_sheet ? existing.id : (job.data?.status === 'completed' ? analysis?.targetId : null);
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar"><ArrowLeft size={22} color={colors.text.primary} /></Pressable>
        <View style={s.headerText}>
          <Text style={s.title}>Importar cifra</Text>
          <Text style={s.subtitle} numberOfLines={1}>{item.data.title} · {item.data.artist}</Text>
        </View>
      </View>
      {!!error && <View style={s.error}><ErrorBanner message={error} /><Pressable onPress={() => root?.navigate('Plans')} accessibilityRole="button" accessibilityLabel="Ver planos"><Text style={s.planLink}>Ver planos</Text></Pressable></View>}

      {targetReady ? (
        <View style={s.ready}>
          <Text style={s.readyTitle}>Sua análise está pronta</Text>
          <Text style={s.centerText}>As correções serão reancoradas sobre a sua própria cifra, sem copiar a base do autor.</Text>
          <PrimaryButton label="Importar correções" loading={importer.isPending} onPress={() => importTo(targetReady)} />
        </View>
      ) : analysis ? (
        <CifraAnalysisProgressCard result={analysis.result} job={job.data} flowError={error} isAdding={false} onAddToRepertoire={() => {}} onRetry={() => setAnalysis(null)} />
      ) : (
        <>
          <Text style={s.instructions}>{existing ? 'Sua música ainda precisa de análise. Escolha a gravação correta:' : 'Você ainda não tem essa música. Escolha a gravação correta para criar e analisar:'}</Text>
          <FlatList<CifraSearchResult>
            data={catalog.data ?? []}
            keyExtractor={(result) => result.youtube_video_id}
            contentContainerStyle={s.list}
            ListEmptyComponent={catalog.isPending ? <SkeletonList count={3} itemHeight={88} /> : <Text style={s.centerText}>Nenhuma gravação encontrada.</Text>}
            renderItem={({ item: result }) => <CifraSearchResultCard result={result} onPress={() => selectCatalogResult(result)} />}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function ScreenState({ children }: { children: React.ReactNode }) {
  const s = useStyles();
  return <SafeAreaView style={s.state} edges={['top', 'bottom']}>{children}</SafeAreaView>;
}
