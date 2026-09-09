import { View, Text, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { FileX } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ChordTokenLine, type LineState } from '@/shared/components/ChordTokenLine';
import type { PlayModeFlatLine } from '../../domain/play-mode.types';
import type { ChordSheetScrollBinding } from '../../application/usePracticeScrollSync';

type Props = {
  isPending:    boolean;
  flatLines:    PlayModeFlatLine[];
  // Só os cinco callbacks que esta view realmente usa, em vez do retorno
  // inteiro de `usePlayModeAutoScroll`. O Modo Ensaio dirige a rolagem pelo
  // áudio (`usePracticeScrollSync`) e satisfaz o mesmo contrato sem carregar o
  // playhead virtual, que ali não faz sentido.
  scroll:       ChordSheetScrollBinding;
  lineState:    (index: number) => LineState;
  onPressChord: (symbol: string) => void;
};

// Extraído de PlayModeScreen.tsx (jul/2026, > 200 linhas depois dos ajustes
// de instrumento/tom/capotraste) — só o corpo rolável da tela: loading,
// vazio, ou a lista de linhas com auto-scroll. Sem lógica própria, só
// orquestra o que a tela já calculou.
const useStyles = makeStyles((colors) => ({
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
}));

export function PlayModeChordSheetView({ isPending, flatLines, scroll, lineState, onPressChord }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  if (isPending) {
    return (
      <View style={s.centerRoot}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  if (flatLines.length === 0) {
    // Backend sempre retorna 200 mesmo sem chords/lyrics (ex.: análise
    // ainda não gerou nada usável) — sem esse estado explícito a tela
    // ficaria em branco, sem nenhuma pista do porquê.
    return (
      <View style={s.centerRoot}>
        <FileX size={40} color={colors.text.muted} />
        <Text style={s.emptyTitle}>Sem cifra disponível</Text>
        <Text style={s.emptySubtitle}>Essa música ainda não tem letra ou acordes prontos pra exibir.</Text>
      </View>
    );
  }

  return (
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
          onPressChord={onPressChord}
        />
      ))}
    </Animated.ScrollView>
  );
}
