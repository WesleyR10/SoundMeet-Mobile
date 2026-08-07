import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, FileX, SlidersHorizontal } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ChordTokenLine } from '@/shared/components/ChordTokenLine';
import { ChordDiagramSheet } from '@/shared/components/ChordDiagramSheet';
import { ChordSheetControlsSheet } from '@/shared/components/ChordSheetControlsSheet';
import { useChordSheetControls } from '@/shared/hooks/useChordSheetControls';
import { transposeTokenGrid, shouldPreferFlatsForKey } from '@/shared/utils/chord-transpose';
import { useSharedChordSheet } from '../../application/useSharedRepertoire';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'SharedSongViewer'>;

// Visualizador ESTÁTICO — sem auto-scroll, sem controles de performance
// (prev/next/velocidade): esses fazem sentido pra quem está tocando ao
// vivo (Play Mode), não pra quem só está lendo/acompanhando um repertório
// de outra pessoa. Auto-scroll aqui pode virar um adicional futuro (ex.:
// fã acompanhando cantando junto), mas não faz parte deste escopo. Ganhou
// os mesmos ajustes de instrumento/tom/capotraste do Play Mode — útil até
// mais aqui (quem abre um link compartilhado pode estar estudando/
// praticando, não só tocando ao vivo).
export function SharedSongViewerScreen({ navigation, route }: Props) {
  const { token, musicLibraryId } = route.params;
  const { data: chordSheet, grid: rawGrid, isPending } = useSharedChordSheet(token, musicLibraryId);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const controls = useChordSheetControls();

  const preferFlats = shouldPreferFlatsForKey(chordSheet?.meta.key);
  const grid = useMemo(
    () => (rawGrid ? transposeTokenGrid(rawGrid, controls.displayShiftSemitones, preferFlats) : null),
    [rawGrid, controls.displayShiftSemitones, preferFlats],
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title} numberOfLines={1}>{chordSheet?.title ?? ''}</Text>
          <Text style={s.artist} numberOfLines={1}>{chordSheet?.artist ?? ''}</Text>
        </View>
        <Pressable onPress={() => setControlsVisible(true)} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Ajustes da cifra (instrumento, tom, capotraste)" hitSlop={8}>
          <SlidersHorizontal size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      {isPending ? (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : !grid || grid.every((section) => section.lines.length === 0) ? (
        <View style={s.centerRoot}>
          <FileX size={40} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Sem cifra disponível</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {grid.flatMap((section, sectionIndex) =>
            section.lines.map((line, lineIndex) => (
              <ChordTokenLine
                key={`${sectionIndex}-${lineIndex}`}
                label={lineIndex === 0 ? section.label : undefined}
                tokens={line.tokens}
                index={lineIndex}
                state="static"
                onPressChord={setSelectedChord}
              />
            )),
          )}
        </ScrollView>
      )}

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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.md,
    paddingHorizontal:  spacing.lg,
    paddingTop:         spacing.md,
    paddingBottom:      spacing.lg,
    // Mesma família visual do PlayModeTopBar (linha de destaque teal fina) —
    // dá identidade de "folha de cifra SoundMeet" mesmo nessa versão
    // read-only pública, sem introduzir nenhum controle novo.
    borderBottomWidth: 1,
    borderBottomColor: colors.border.brand,
  },
  backBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  iconBtn: {
    width:          40,
    height:         40,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    paddingTop:    spacing.md,
    paddingBottom: spacing.xxxl,
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
});
