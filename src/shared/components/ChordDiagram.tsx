import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '@/shared/design-system/tokens';
import type { ChordDiagramPosition } from '@/shared/utils/chord-diagram-lookup';

const STRING_COUNT = 6;
const SVG_WIDTH    = 200;
const MARGIN_X     = 24;
const MARGIN_TOP   = 36;
const NECK_HEIGHT  = 140;
const NECK_WIDTH   = SVG_WIDTH - MARGIN_X * 2;
const STRING_GAP   = NECK_WIDTH / (STRING_COUNT - 1);
const DOT_RADIUS   = 11;

function stringX(index: number) {
  return MARGIN_X + index * STRING_GAP;
}

// Braço do violão renderizado 100% em react-native-svg (já instalado) — sem
// lib de terceiros de diagrama, controle total do visual pra bater com a
// identidade teal/dark do app. Puramente apresentacional: recebe a posição
// já resolvida por chord-diagram-lookup.ts, não busca dado nenhum.
export function ChordDiagram({ position }: { position: ChordDiagramPosition }) {
  const { frets, fingers, barres, baseFret } = position;

  const fretRows = useMemo(
    () => Math.min(6, Math.max(4, 0, ...frets.filter((f) => f > 0))),
    [frets],
  );
  const fretGap = NECK_HEIGHT / fretRows;

  const markers = useMemo(
    () => frets.map((f) => (f === -1 ? 'x' as const : f === 0 ? 'o' as const : null)),
    [frets],
  );

  const dots = useMemo(
    () =>
      frets
        .map((f, stringIndex) => ({ f, stringIndex }))
        .filter(({ f }) => f > 0)
        .map(({ f, stringIndex }) => ({ stringIndex, fretRow: f, finger: fingers[stringIndex] })),
    [frets, fingers],
  );

  const barreShapes = useMemo(() => {
    return (barres ?? [])
      .map((fretRow) => {
        const strings = frets
          .map((f, i) => (f === fretRow ? i : null))
          .filter((i): i is number => i !== null);
        return strings.length >= 2 ? { fretRow, from: Math.min(...strings), to: Math.max(...strings) } : null;
      })
      .filter((b): b is { fretRow: number; from: number; to: number } => b !== null);
  }, [barres, frets]);

  const rowCenterY = (relativeFret: number) => MARGIN_TOP + (relativeFret - 1) * fretGap + fretGap / 2;

  return (
    <View style={s.wrap}>
      <Svg width={SVG_WIDTH} height={MARGIN_TOP + NECK_HEIGHT + 24}>
        {baseFret === 1 ? (
          <Rect x={MARGIN_X - 2} y={MARGIN_TOP - 3} width={NECK_WIDTH + 4} height={5} fill={colors.text.primary} rx={2} />
        ) : (
          <SvgText x={MARGIN_X - 12} y={rowCenterY(1) + 5} fill={colors.text.secondary} fontSize={13} fontFamily="JetBrainsMono-Bold" textAnchor="end">
            {`${baseFret}fr`}
          </SvgText>
        )}

        {Array.from({ length: fretRows + 1 }).map((_, i) => (
          <Line
            key={`fret-${i}`}
            x1={MARGIN_X} x2={MARGIN_X + NECK_WIDTH}
            y1={MARGIN_TOP + i * fretGap} y2={MARGIN_TOP + i * fretGap}
            stroke={colors.border.strong}
            strokeWidth={i === 0 && baseFret === 1 ? 0 : 1.5}
          />
        ))}

        {Array.from({ length: STRING_COUNT }).map((_, i) => (
          <Line
            key={`string-${i}`}
            x1={stringX(i)} x2={stringX(i)}
            y1={MARGIN_TOP} y2={MARGIN_TOP + fretRows * fretGap}
            stroke={colors.text.secondary}
            strokeWidth={1.5}
          />
        ))}

        {barreShapes.map((b) => (
          <Rect
            key={`barre-${b.fretRow}`}
            x={stringX(b.from) - DOT_RADIUS}
            y={rowCenterY(b.fretRow) - DOT_RADIUS}
            width={stringX(b.to) - stringX(b.from) + DOT_RADIUS * 2}
            height={DOT_RADIUS * 2}
            rx={DOT_RADIUS}
            fill={colors.brand.primary}
            opacity={0.85}
          />
        ))}

        {dots.map(({ stringIndex, fretRow, finger }) => (
          <Circle key={`dot-${stringIndex}`} cx={stringX(stringIndex)} cy={rowCenterY(fretRow)} r={DOT_RADIUS} fill={colors.brand.primary} />
        ))}
        {dots.map(({ stringIndex, fretRow, finger }) =>
          finger > 0 ? (
            <SvgText
              key={`finger-${stringIndex}`}
              x={stringX(stringIndex)} y={rowCenterY(fretRow) + 4}
              fill={colors.bg.primary} fontSize={11} fontFamily="Inter-Bold" textAnchor="middle"
            >
              {finger}
            </SvgText>
          ) : null,
        )}

        {markers.map((marker, i) =>
          marker ? (
            <SvgText
              key={`marker-${i}`}
              x={stringX(i)} y={MARGIN_TOP - 14}
              fill={marker === 'x' ? colors.text.muted : colors.brand.primary}
              fontSize={16} fontFamily="Inter-Bold" textAnchor="middle"
            >
              {marker === 'x' ? '×' : '○'}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
