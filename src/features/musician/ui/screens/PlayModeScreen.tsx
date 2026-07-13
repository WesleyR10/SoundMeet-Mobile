import { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { FileX } from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { ChordTokenLine, type LineState } from '@/shared/components/ChordTokenLine';
import { useRepertoire } from '../../application/useRepertoire';
import { useChordSheet } from '../../application/useChordSheet';
import { useRequests } from '../../application/useRequests';
import { usePlayModeAutoScroll } from '../../application/usePlayModeAutoScroll';
import { buildFlatLines } from '../../application/chord-sheet-timing';
import { PlayModeTopBar } from '../components/PlayModeTopBar';
import { PlayModeBottomBar } from '../components/PlayModeBottomBar';
import type { RepertoireScreenProps } from '@/navigation/types';

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
  const { data: chordSheet, grid, isPending } = useChordSheet(
    repertoireId,
    repertoire?.musician_id ?? null,
    musicLibraryId,
  );
  const { data: pendingRequests } = useRequests(musicianId, 'pending');

  const flatLines = useMemo(() => (grid ? buildFlatLines(grid) : []), [grid]);
  const scroll = usePlayModeAutoScroll(flatLines);

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

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar hidden />

      <PlayModeTopBar
        title={chordSheet?.title ?? ''}
        artist={chordSheet?.artist ?? ''}
        progress={scroll.progressPercent / 100}
        pendingCount={pendingRequests?.pending_count ?? 0}
        onPressBadge={() => navigation.getParent()?.navigate('LiveDashboard')}
        onPressBack={() => navigation.goBack()}
      />

      {isPending ? (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : flatLines.length === 0 ? (
        // Backend sempre retorna 200 mesmo sem chords/lyrics (ex.: análise
        // ainda não gerou nada usável) — sem esse estado explícito a tela
        // ficaria em branco, sem nenhuma pista do porquê.
        <View style={s.centerRoot}>
          <FileX size={40} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Sem cifra disponível</Text>
          <Text style={s.emptySubtitle}>Essa música ainda não tem letra ou acordes prontos pra exibir.</Text>
        </View>
      ) : (
        <Animated.ScrollView
          ref={scroll.scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          onScrollBeginDrag={scroll.onScrollBeginDrag}
          onScrollEndDrag={scroll.onScrollEnd}
          onMomentumScrollEnd={scroll.onScrollEnd}
          onContentSizeChange={(_w, h) => scroll.reportContentHeight(h)}
          showsVerticalScrollIndicator={false}
        >
          {flatLines.map((line, index) => (
            <ChordTokenLine
              key={`${line.sectionIndex}-${line.lineIndexInSection}`}
              label={line.label}
              tokens={line.tokens}
              index={index}
              state={lineState(index)}
              onLayoutY={scroll.reportLineLayout}
            />
          ))}
        </Animated.ScrollView>
      )}

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop:    spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  centerRoot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.sm,
    padding:          spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
});
