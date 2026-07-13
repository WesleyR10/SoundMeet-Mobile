import { useCallback } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
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
  onLayoutY?: (index: number, y: number) => void;
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
export function ChordTokenLine({ label, tokens, index, state, onLayoutY }: Props) {
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    onLayoutY?.(index, e.nativeEvent.layout.y);
  }, [index, onLayoutY]);

  const wordStyle = [
    s.word,
    state === 'active' && s.wordActive,
    state === 'past' && s.wordPast,
    state === 'future' && s.wordFuture,
  ];

  return (
    <View onLayout={handleLayout} style={[s.root, state === 'active' && s.rootActive]}>
      {!!label && <Text style={s.sectionLabel}>{label}</Text>}

      <View style={s.row}>
        {tokens.map((token, tokenIndex) => (
          <View key={tokenIndex} style={s.tokenCol}>
            <Text style={s.chord}>{token.chordSymbol ?? ' '}</Text>
            <Text style={wordStyle}>{token.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.lg,
    borderLeftWidth:    3,
    borderLeftColor:   'transparent',
  },
  rootActive: {
    borderLeftColor: colors.brand.primary,
    backgroundColor: colors.brand.muted,
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
  chord: {
    ...typography.chordLive,
    color:  colors.brand.primary,
    height: typography.chordLive.lineHeight,
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
