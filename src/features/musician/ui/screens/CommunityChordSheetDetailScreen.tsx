import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react-native';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonText } from '@/shared/components/Skeleton';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { ChordDiagramSheet } from '@/shared/components/ChordDiagramSheet';
import { ChordSheetControlsSheet } from '@/shared/components/ChordSheetControlsSheet';
import { useChordSheetControls } from '@/shared/hooks/useChordSheetControls';
import { isApiError } from '@/shared/services/http/types';
import { transposeTokenGrid, shouldPreferFlatsForKey } from '@/shared/utils/chord-transpose';
import type { RepertoireScreenProps } from '@/navigation/types';
import { useCommunityChordSheet } from '../../application/useCommunityChordSheet';
import { useCommunityChordSheetView } from '../../application/useCommunityChordSheetView';
import { useMusicLibraryItem } from '../../application/useMusicLibraryItem';
import { PersonalChordSheetReadOnlyBody } from '../components/PersonalChordSheetReadOnlyBody';

type Props = RepertoireScreenProps<'CommunityChordSheetDetail'>;

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl, backgroundColor: colors.bg.primary },
  stateTitle: { ...typography.title, color: colors.text.primary, textAlign: 'center' },
  stateText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, gap: 1 },
  title: { ...typography.title, color: colors.text.primary },
  artist: { ...typography.caption, color: colors.text.secondary },
  cta: {
    minHeight: 58, marginHorizontal: spacing.xl, marginBottom: spacing.md, borderRadius: radius.xl,
    backgroundColor: colors.accent.violet, alignItems: 'center', justifyContent: 'center', ...shadows.violet,
  },
  ctaText: { ...typography.body, fontFamily: 'SpaceGrotesk-Bold', color: colors.text.primary },
  bandNotice: {
    minHeight: 48, marginHorizontal: spacing.xl, marginBottom: spacing.md,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.brand,
    backgroundColor: colors.brand.muted, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  bandNoticeText: { ...typography.bodySm, color: colors.brand.primary, textAlign: 'center' },
}));

export function CommunityChordSheetDetailScreen({ navigation, route }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const id = route.params.personalChordSheetId;
  const detail = useCommunityChordSheet(id);
  const view = useCommunityChordSheetView(id);
  const item = useMusicLibraryItem(detail.data?.music_library_id ?? null);
  const controls = useChordSheetControls();
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const preferFlats = shouldPreferFlatsForKey(view.data?.sheet.meta.key);
  const grid = useMemo(
    () => view.grid ? transposeTokenGrid(view.grid, controls.displayShiftSemitones, preferFlats) : null,
    [view.grid, controls.displayShiftSemitones, preferFlats],
  );
  const forbidden = (detail.isError && isApiError(detail.error) && detail.error.response?.status === 403)
    || (view.isError && isApiError(view.error) && view.error.response?.status === 403);

  if (detail.isPending || view.isPending) {
    return <ScreenState><SkeletonText lines={10} /></ScreenState>;
  }
  if (forbidden) {
    return <ScreenState><Text style={s.stateTitle}>Acesso restrito</Text><Text style={s.stateText}>Esta cifra está disponível apenas para músicos da banda do autor.</Text></ScreenState>;
  }
  if (!detail.data || !view.data || !grid) {
    return <ScreenState><ErrorBanner message="Não conseguimos abrir esta cifra compartilhada." /></ScreenState>;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title} numberOfLines={1}>{item.data?.title ?? view.data.sheet.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{item.data?.artist ?? view.data.sheet.artist}</Text>
        </View>
        <Pressable onPress={() => setControlsVisible(true)} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Ajustes de visualização">
          <SlidersHorizontal size={20} color={colors.text.secondary} />
        </Pressable>
      </View>
      <PersonalChordSheetReadOnlyBody grid={grid} annotations={detail.data.edits} onPressChord={setSelectedChord} />
      {detail.data.share_scope === 'community' ? (
        <Pressable onPress={() => navigation.navigate('ImportCommunityChordSheet', { sourcePersonalChordSheetId: id })} style={s.cta} accessibilityRole="button">
          <Text style={s.ctaText}>Importar pra minha biblioteca</Text>
        </Pressable>
      ) : (
        <View style={s.bandNotice}>
          <Text style={s.bandNoticeText}>Compartilhada com sua banda · somente leitura</Text>
        </View>
      )}
      <ChordDiagramSheet visible={!!selectedChord} chordSymbol={selectedChord} instrument={controls.instrument} capoFret={controls.capoFret} preferFlats={preferFlats} onClose={() => setSelectedChord(null)} />
      <ChordSheetControlsSheet
        visible={controlsVisible}
        onClose={() => setControlsVisible(false)}
        instrument={controls.instrument}
        onChangeInstrument={controls.setInstrument}
        transposeSemitones={controls.transposeSemitones}
        onChangeTranspose={controls.setTransposeSemitones}
        capoFret={controls.capoFret}
        onChangeCapo={controls.setCapoFret}
      />
    </SafeAreaView>
  );
}

function ScreenState({ children }: { children: React.ReactNode }) {
  const s = useStyles();
  return <SafeAreaView style={s.state} edges={['top', 'bottom']}>{children}</SafeAreaView>;
}
