import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import type { LineState } from '@/shared/components/ChordTokenLine';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { extractApiMessage } from '@/shared/services/http/types';
import type { RepertoireScreenProps } from '@/navigation/types';
import { useRepertoire } from '../../application/useRepertoire';
import { useChordSheet } from '../../application/useChordSheet';
import { buildFlatLines } from '../../application/chord-sheet-timing';
import {
  usePracticeSeparationJob,
  useRequestPracticeSeparation,
} from '../../application/usePracticeSeparation';
import { usePracticeStems } from '../../application/usePracticeStems';
import { usePracticeScrollSync } from '../../application/usePracticeScrollSync';
import { PlayModeChordSheetView } from '../components/PlayModeChordSheetView';
import { PracticePrepareCard } from '../components/PracticePrepareCard';
import { PracticeTransport } from '../components/PracticeTransport';
import { StemMixerRow } from '../components/StemMixerRow';

type Props = RepertoireScreenProps<'PracticeMode'>;

/**
 * Modo Ensaio (S3) — a UI que faltava para o `ai-audio`.
 *
 * ## Por que é uma tela separada do Play Mode
 *
 * O Play Mode é a tela de PALCO: fonte grande, contraste máximo, zero
 * distração, e é ele que transmite "tocando agora" quando há set aberto.
 * Encher aquela tela de mesa de som e controle de velocidade contraria a regra
 * de UX do músico e coloca o caminho ao vivo em risco por uma feature de
 * estudo. As duas telas compartilham a renderização da cifra
 * (`PlayModeChordSheetView`) e nada de estado.
 *
 * ## A cifra rola pelo áudio, não por estimativa
 *
 * No palco não existe gravação tocando, então `usePlayModeAutoScroll` estima o
 * andamento com um playhead virtual que o músico calibra num slider. Aqui a
 * gravação está tocando: `usePracticeScrollSync` usa a posição real como fonte
 * da rolagem — nada a calibrar, e a cifra não desanda ao longo da música.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.sm,
    paddingHorizontal:  spacing.lg,
    paddingVertical:    spacing.md,
  },
  headerBtn: {
    width:           44,
    height:          44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  banner: {
    marginHorizontal: spacing.lg,
  },
  prepareScroll: {
    padding:        spacing.lg,
    paddingBottom:  spacing.xxxl,
  },
  dock: {
    gap:               spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
    borderTopWidth:    1,
    borderTopColor:    colors.border.default,
    backgroundColor:   colors.bg.surface,
  },
  mixer: {
    maxHeight: 200,
  },
  mixerContent: {
    gap: spacing.sm,
  },
}));

export function PracticeModeScreen({ navigation, route }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  useKeepAwake();
  const { repertoireId, musicLibraryId } = route.params;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const { data: repertoire } = useRepertoire(musicianId, repertoireId);
  const { data: chordSheet, grid, isPending: sheetPending } = useChordSheet(
    repertoireId,
    repertoire?.musician_id ?? null,
    musicLibraryId,
  );

  const requestSeparation = useRequestPracticeSeparation(musicianId);
  const { data: job } = usePracticeSeparationJob(jobId);

  const flatLines = useMemo(() => (grid ? buildFlatLines(grid) : []), [grid]);
  const stems = useMemo(() => job?.outputs ?? [], [job?.outputs]);
  const player = usePracticeStems(stems);
  const scroll = usePracticeScrollSync(flatLines, player.position, player.duration);

  const isReadyToPlay = job?.status === 'completed' && player.isReady;

  function startSeparation() {
    setRequestError(null);
    requestSeparation.mutate(musicLibraryId, {
      onSuccess: (created) => setJobId(created.id),
      onError: (error) =>
        setRequestError(
          extractApiMessage(error) ??
            'Não foi possível preparar o ensaio agora.',
        ),
    });
  }

  function lineState(index: number): LineState {
    if (index < scroll.activeLineIndex) return 'past';
    if (index === scroll.activeLineIndex) return 'active';
    return 'future';
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={s.headerBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.title} numberOfLines={1}>
            {chordSheet?.title ?? 'Modo Ensaio'}
          </Text>
          {!!chordSheet?.artist && (
            <Text style={s.subtitle} numberOfLines={1}>
              {chordSheet.artist}
            </Text>
          )}
        </View>
      </View>

      {!!requestError && <ErrorBanner message={requestError} style={s.banner} />}

      {isReadyToPlay ? (
        <>
          <PlayModeChordSheetView
            isPending={sheetPending}
            flatLines={flatLines}
            scroll={scroll}
            lineState={lineState}
            onPressChord={() => undefined}
          />

          <View style={s.dock}>
            <ScrollView
              horizontal={false}
              style={s.mixer}
              contentContainerStyle={s.mixerContent}
              showsVerticalScrollIndicator={false}
            >
              {player.tracks.map((track) => (
                <StemMixerRow
                  key={track.id}
                  track={track}
                  isSoloed={player.soloedId === track.id}
                  isSilenced={
                    track.muted ||
                    (!!player.soloedId && player.soloedId !== track.id)
                  }
                  onToggleMute={() => player.toggleMute(track.id)}
                  onToggleSolo={() => player.toggleSolo(track.id)}
                />
              ))}
            </ScrollView>

            <PracticeTransport
              isPlaying={player.isPlaying}
              position={player.position}
              duration={player.duration}
              rate={player.rate}
              onToggle={player.toggle}
              onSeek={player.seekTo}
              onRate={player.setRate}
            />
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={s.prepareScroll}>
          <PracticePrepareCard
            status={job?.status ?? 'idle'}
            progress={job?.progress_percent ?? 0}
            stage={job?.progress_stage ?? null}
            errorMessage={job?.error_message ?? null}
            isRequesting={requestSeparation.isPending}
            onStart={startSeparation}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
