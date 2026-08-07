import { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import type { RenderableToken } from '@/shared/utils/chord-sheet';

// 'static' = sem noção de posição de scroll (visualizador de repertório
// compartilhado) — usa a cor base (branco cheio), sem "esmaecer" como
// 'future' faria no Play Mode (lá, dim = "ainda não chegou nessa linha";
// aqui não existe playhead nenhum, então dim ficaria parecendo bug).
export type LineState = 'past' | 'active' | 'future' | 'static';

type Props = {
  label?:     string;
  tokens:     RenderableToken[];
  index:      number;
  state:      LineState;
  // onLayoutY é opcional — só o Play Mode (auto-scroll) precisa medir
  // posição; um visualizador estático (repertório compartilhado) não.
  onLayoutY?:    (index: number, y: number) => void;
  // onPressChord é opcional e disponível nos dois consumidores (Play Mode e
  // visualizador compartilhado) — abre o ChordDiagramSheet (shared/) com o
  // símbolo tocado. Só tokens com chordSymbol viram Pressable; token de
  // palavra pura não tem alvo de toque morto.
  onPressChord?: (symbol: string) => void;
  // onPressToken é aditivo (jul/2026, cifra pessoal — Bloco 8D) — quando
  // presente, tem PRIORIDADE sobre onPressChord e torna TODO token
  // pressable (com ou sem acorde, necessário pra inserir acorde/anotar num
  // ponto sem acorde ainda), trocando o sublinhado pontilhado teal do modo
  // "ver diagrama" por uma borda tracejada na coluna inteira ("isso é
  // editável"). Só o editor de cifra pessoal passa isso; Play Mode e
  // SharedSongViewer continuam 100% intocados (ausência de prop = mesmo
  // comportamento de sempre).
  onPressToken?: (token: RenderableToken, tokenIndex: number) => void;
};

// Uma linha de cifra — renderização token a token via Flexbox
// (flexDirection: row + flexWrap), não Skia/SVG: o backend já garante
// "reflow só redistribui tokens, não altera anchors" (Docs/AI-musician/
// chord-sheet.md), então texto nativo reflowável é exatamente o que esse
// contrato foi desenhado pra alimentar — zero dependência nova. Cada token
// é uma coluna com o acorde (quando existe) empilhado acima da palavra.
// Promovido de features/musician pra shared/ (jul/2026) — reusado tanto
// pelo Play Mode (auto-scroll, precisa de onLayoutY + state) quanto pelo
// visualizador estático de repertório compartilhado publicamente (sem
// scroll automático, state sempre 'future').
export function ChordTokenLine({ label, tokens, index, state, onLayoutY, onPressChord, onPressToken }: Props) {
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    onLayoutY?.(index, e.nativeEvent.layout.y);
  }, [index, onLayoutY]);

  const handlePressChord = useCallback((symbol: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressChord?.(symbol);
  }, [onPressChord]);

  const handlePressToken = useCallback((token: RenderableToken, tokenIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressToken?.(token, tokenIndex);
  }, [onPressToken]);

  // Transição da linha ativa via mola (não corte instantâneo de cor) —
  // um shared value por linha é barato (não é looping, só anima na troca
  // de estado) e dá o "glow" de destaque sem tocar em Skia.
  const activeProgress = useSharedValue(state === 'active' ? 1 : 0);
  useEffect(() => {
    activeProgress.value = withSpring(state === 'active' ? 1 : 0, {
      damping: 18,
      stiffness: 180,
    });
  }, [state, activeProgress]);

  const animatedRootStyle = useAnimatedStyle(() => ({
    borderLeftColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      ['transparent', colors.brand.primary],
    ),
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      ['rgba(0,224,184,0)', colors.brand.muted],
    ),
  }));

  const wordStyle = [
    s.word,
    state === 'active' && s.wordActive,
    state === 'past' && s.wordPast,
    state === 'future' && s.wordFuture,
  ];

  return (
    <Animated.View onLayout={handleLayout} style={[s.root, animatedRootStyle]}>
      {!!label && <Text style={s.sectionLabel}>{label}</Text>}

      <View style={s.row}>
        {tokens.map((token, tokenIndex) => {
          if (onPressToken) {
            return (
              <Pressable
                key={tokenIndex}
                onPress={() => handlePressToken(token, tokenIndex)}
                style={[s.tokenCol, s.tokenColEditable]}
                hitSlop={{ top: 8, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={
                  token.chordSymbol ? `Editar acorde ${token.chordSymbol}` : `Adicionar acorde ou anotação em "${token.text}"`
                }
              >
                <Text style={s.chord}>{token.chordSymbol ?? ' '}</Text>
                <Text style={wordStyle}>{token.text}</Text>
              </Pressable>
            );
          }

          return (
            <View key={tokenIndex} style={s.tokenCol}>
              {token.chordSymbol && onPressChord ? (
                <Pressable
                  onPress={() => handlePressChord(token.chordSymbol!)}
                  hitSlop={{ top: 12, bottom: 4, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver diagrama do acorde ${token.chordSymbol}`}
                >
                  <Text style={[s.chord, s.chordTappable]}>{token.chordSymbol}</Text>
                </Pressable>
              ) : (
                <Text style={s.chord}>{token.chordSymbol ?? ' '}</Text>
              )}
              <Text style={wordStyle}>{token.text}</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.lg,
    borderLeftWidth:    3,
    borderLeftColor:   'transparent',
    borderRadius:       4,
  },
  sectionLabel: {
    ...typography.caption,
    color:          colors.brand.primary,
    letterSpacing:   1.2,
    textTransform:  'uppercase',
    marginBottom:    spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    alignItems:    'flex-end',
  },
  tokenCol: {
    alignItems:   'flex-start',
    marginRight:   2,
  },
  // Modo edição (onPressToken) — borda tracejada na coluna inteira em vez do
  // sublinhado só-no-acorde do modo visualização, pra sinalizar "toque em
  // qualquer palavra pra corrigir/inserir/anotar", não só nos acordes.
  tokenColEditable: {
    borderWidth:        1,
    borderStyle:        'dashed',
    borderColor:        'rgba(0,224,184,0.35)',
    borderRadius:        4,
    paddingHorizontal:   2,
    paddingBottom:        1,
  },
  chord: {
    ...typography.chordLive,
    color:  colors.brand.primary,
    height: typography.chordLive.lineHeight,
  },
  // Sublinhado pontilhado bem sutil — sinaliza "isso é tocável" sem gritar;
  // só aparece quando onPressChord existe (ver JSX acima).
  chordTappable: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,224,184,0.45)',
    borderStyle:       'dotted',
  },
  word: {
    ...typography.liveBody,
    color: colors.text.primary,
  },
  wordActive: {
    color:      colors.text.primary,
    fontFamily: 'Inter-SemiBold',
  },
  wordPast: {
    color: colors.text.muted,
  },
  wordFuture: {
    color: 'rgba(248,250,252,0.55)',
  },
});
