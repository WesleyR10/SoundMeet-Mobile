import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { LineState } from '@/shared/components/ChordTokenLine';
import { ChordDiagramSheet } from '@/shared/components/ChordDiagramSheet';
import { ChordSheetControlsSheet } from '@/shared/components/ChordSheetControlsSheet';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useChordSheetControls } from '@/shared/hooks/useChordSheetControls';
import { transposeTokenGrid, shouldPreferFlatsForKey } from '@/shared/utils/chord-transpose';
import { useRepertoire } from '../../application/useRepertoire';
import { useChordSheet } from '../../application/useChordSheet';
import { useRequests } from '../../application/useRequests';
import { useMusician } from '../../application/useMusician';
import { usePlayModeAutoScroll } from '../../application/usePlayModeAutoScroll';
import { usePersonalChordSheetExists } from '../../application/usePersonalChordSheets';
import { useForkChordSheet, getPersonalChordSheetMutationErrorMessage } from '../../application/usePersonalChordSheetMutations';
import { buildFlatLines } from '../../application/chord-sheet-timing';
import { PlayModeTopBar } from '../components/PlayModeTopBar';
import { PlayModeBottomBar } from '../components/PlayModeBottomBar';
import { PlayModeChordSheetView } from '../components/PlayModeChordSheetView';
import { SectionTransitionBadge } from '../components/SectionTransitionBadge';
import { ForkChordSheetConfirmSheet } from '../components/ForkChordSheetConfirmSheet';
import type { MusicianTabParamList, RepertoireScreenProps, RootStackParamList } from '@/navigation/types';

type Props = RepertoireScreenProps<'PlayMode'>;

const SPEED_STEP = 0.25;

// Teleprompter musical (Bloco 7, 7.8a-g) — fullscreen, sem distração. Motor
// de auto-scroll em usePlayModeAutoScroll.ts (§1 do plano); esta tela só
// orquestra fetch + navegação entre músicas do repertório + as duas barras.
export function PlayModeScreen({ navigation, route }: Props) {
  useKeepAwake();
  const { repertoireId, musicLibraryId } = route.params;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const { data: repertoire } = useRepertoire(musicianId, repertoireId);
  // Sempre via repertório (dono OU convidado nominal) — ver fix do gap de
  // convite nominal (Bloco 7 revisão): repertoire.musician_id é o DONO,
  // musicianId (acima) é só quem está logado, podem ser pessoas diferentes.
  const { data: chordSheet, grid: rawGrid, isPending } = useChordSheet(
    repertoireId,
    repertoire?.musician_id ?? null,
    musicLibraryId,
  );
  const { data: pendingRequests } = useRequests(musicianId, 'pending');
  const { data: ownerProfile } = useMusician(repertoire?.musician_id ?? null);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [forkVisible, setForkVisible] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);
  const controls = useChordSheetControls();
  const ownsRepertoire = !!musicianId && repertoire?.musician_id === musicianId;
  const personalSheet = usePersonalChordSheetExists(
    ownsRepertoire ? musicianId : null,
    ownsRepertoire ? musicLibraryId : null,
  );
  const fork = useForkChordSheet(musicianId);
  const tabs = navigation.getParent<BottomTabNavigationProp<MusicianTabParamList>>();
  const rootNavigation = tabs?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const preferFlats = shouldPreferFlatsForKey(chordSheet?.meta.key);
  const grid = useMemo(
    () => (rawGrid ? transposeTokenGrid(rawGrid, controls.displayShiftSemitones, preferFlats) : null),
    [rawGrid, controls.displayShiftSemitones, preferFlats],
  );
  const flatLines = useMemo(() => (grid ? buildFlatLines(grid) : []), [grid]);
  const scroll = usePlayModeAutoScroll(flatLines);

  // label só vem preenchido na primeira linha achatada de cada seção (ver
  // buildFlatLines) — mapeia sectionIndex -> label uma vez só, pra poder
  // resolver o rótulo da seção ativa mesmo quando ela não está na linha 0.
  const sectionLabels = useMemo(() => {
    const map = new Map<number, string>();
    for (const line of flatLines) {
      if (line.label && !map.has(line.sectionIndex)) map.set(line.sectionIndex, line.label);
    }
    return map;
  }, [flatLines]);
  const activeSectionIndex = flatLines[scroll.activeLineIndex]?.sectionIndex;
  const activeSectionLabel =
    activeSectionIndex !== undefined ? sectionLabels.get(activeSectionIndex) : undefined;

  const songIndex = repertoire?.songs.findIndex((s) => s.music_library_id === musicLibraryId) ?? -1;
  const prevSong = songIndex > 0 ? repertoire?.songs[songIndex - 1] : null;
  const nextSong = songIndex >= 0 && repertoire ? repertoire.songs[songIndex + 1] : null;

  function goToSong(nextMusicLibraryId: string) {
    scroll.pause();
    navigation.setParams({ repertoireId, musicLibraryId: nextMusicLibraryId });
  }

  function lineState(index: number): LineState {
    if (index < scroll.activeLineIndex) return 'past';
    if (index === scroll.activeLineIndex) return 'active';
    return 'future';
  }

  function openPersonalChordSheet() {
    if (personalSheet.existingId) {
      navigation.navigate('PersonalChordSheetEditor', { personalChordSheetId: personalSheet.existingId });
      return;
    }
    setForkError(null);
    setForkVisible(true);
  }

  async function createPersonalChordSheet() {
    setForkError(null);
    try {
      const created = await fork.mutateAsync(musicLibraryId);
      setForkVisible(false);
      navigation.navigate('PersonalChordSheetEditor', { personalChordSheetId: created.personal_chord_sheet_id });
    } catch (error) {
      setForkError(getPersonalChordSheetMutationErrorMessage(error));
    }
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar hidden />

      <PlayModeTopBar
        title={chordSheet?.title ?? ''}
        artist={chordSheet?.artist ?? ''}
        avatarUrl={ownerProfile?.avatar ?? null}
        progress={scroll.progressPercent / 100}
        pendingCount={pendingRequests?.pending_count ?? 0}
        onPressBadge={() => navigation.getParent()?.navigate('LiveDashboard')}
        onPressBack={() => navigation.goBack()}
        onPressSettings={() => setControlsVisible(true)}
        onPressPersonalChordSheet={ownsRepertoire ? openPersonalChordSheet : undefined}
      />

      {!!forkError && (
        <View style={s.forkError}>
          <ErrorBanner message={forkError} />
          <Pressable onPress={() => rootNavigation?.navigate('Plans')}>
            <Text style={s.planLink}>Ver planos</Text>
          </Pressable>
        </View>
      )}

      <View style={s.sectionBadgeSlot}>
        {activeSectionLabel ? (
          <SectionTransitionBadge key={`${activeSectionIndex}-${activeSectionLabel}`} label={activeSectionLabel} />
        ) : null}
      </View>

      <PlayModeChordSheetView
        isPending={isPending}
        flatLines={flatLines}
        scroll={scroll}
        lineState={lineState}
        onPressChord={setSelectedChord}
      />

      <ChordDiagramSheet
        visible={!!selectedChord}
        chordSymbol={selectedChord}
        instrument={controls.instrument}
        capoFret={controls.instrument === 'guitar' ? controls.capoFret : null}
        preferFlats={preferFlats}
        onClose={() => setSelectedChord(null)}
      />

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

      <ForkChordSheetConfirmSheet
        visible={forkVisible}
        loading={fork.isPending}
        onConfirm={createPersonalChordSheet}
        onClose={() => setForkVisible(false)}
      />

      <PlayModeBottomBar
        isPlaying={scroll.isPlaying}
        playDisabled={!scroll.hasMeasured}
        onTogglePlay={() => (scroll.isPlaying ? scroll.pause() : scroll.play())}
        onPrev={() => prevSong && goToSong(prevSong.music_library_id)}
        onNext={() => nextSong && goToSong(nextSong.music_library_id)}
        hasPrev={!!prevSong}
        hasNext={!!nextSong}
        speedMultiplier={scroll.speedMultiplier}
        onDecreaseSpeed={() => scroll.setSpeed(scroll.speedMultiplier - SPEED_STEP)}
        onIncreaseSpeed={() => scroll.setSpeed(scroll.speedMultiplier + SPEED_STEP)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  sectionBadgeSlot: {
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
  },
  forkError: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  planLink: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color: colors.brand.primary,
    textAlign: 'center',
  },
});
