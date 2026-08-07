import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '@/shared/design-system/tokens';
import type { PianoChordShape } from '@/shared/utils/chord-diagram-lookup';

const WHITE_KEY_WIDTH  = 34;
const WHITE_KEY_HEIGHT = 140;
const BLACK_KEY_WIDTH  = 21;
const BLACK_KEY_HEIGHT = 88;

// index = posição da tecla branca da esquerda pra direita (0..6)
const WHITE_KEYS = [
  { name: 'C', pc: 0 }, { name: 'D', pc: 2 }, { name: 'E', pc: 4 },
  { name: 'F', pc: 5 }, { name: 'G', pc: 7 }, { name: 'A', pc: 9 }, { name: 'B', pc: 11 },
];
// afterWhiteIndex = a tecla preta fica centrada na borda ENTRE a tecla
// branca desse índice e a próxima (não existe preta entre E-F nem B-C).
const BLACK_KEYS = [
  { name: 'C#', pc: 1, afterWhiteIndex: 0 },
  { name: 'D#', pc: 3, afterWhiteIndex: 1 },
  { name: 'F#', pc: 6, afterWhiteIndex: 3 },
  { name: 'G#', pc: 8, afterWhiteIndex: 4 },
  { name: 'A#', pc: 10, afterWhiteIndex: 5 },
];

// Um oitava (7 brancas + 5 pretas) com as teclas do acorde destacadas — sem
// dedilhado/inversão, só "quais notas", que é o que um diagrama de teclado
// de referência precisa mostrar. 100% react-native-svg, mesmo padrão do
// ChordDiagram.tsx (violão) — puramente apresentacional, recebe a forma já
// resolvida por chord-diagram-lookup.ts.
export function PianoChordDiagram({ rootPitchClass, pitchClasses }: PianoChordShape) {
  const width = WHITE_KEY_WIDTH * WHITE_KEYS.length;

  return (
    <View style={s.wrap}>
      <Svg width={width} height={WHITE_KEY_HEIGHT + 4}>
        {WHITE_KEYS.map((k, i) => {
          const active = pitchClasses.includes(k.pc);
          const isRoot = k.pc === rootPitchClass;
          return (
            <Rect
              key={`w-${k.name}`}
              x={i * WHITE_KEY_WIDTH}
              y={0}
              width={WHITE_KEY_WIDTH - 1}
              height={WHITE_KEY_HEIGHT}
              rx={4}
              fill={active ? (isRoot ? colors.brand.primary : colors.brand.light) : colors.text.primary}
              stroke={colors.border.strong}
              strokeWidth={1}
            />
          );
        })}
        {WHITE_KEYS.map((k, i) =>
          pitchClasses.includes(k.pc) ? (
            <SvgText
              key={`wl-${k.name}`}
              x={i * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2 - 0.5}
              y={WHITE_KEY_HEIGHT - 14}
              fontSize={11}
              fontFamily="Inter-Bold"
              fill={colors.bg.primary}
              textAnchor="middle"
            >
              {k.name}
            </SvgText>
          ) : null,
        )}
        {BLACK_KEYS.map((k) => {
          const active = pitchClasses.includes(k.pc);
          const isRoot = k.pc === rootPitchClass;
          const x = (k.afterWhiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
          return (
            <Rect
              key={`b-${k.name}`}
              x={x}
              y={0}
              width={BLACK_KEY_WIDTH}
              height={BLACK_KEY_HEIGHT}
              rx={3}
              fill={active ? (isRoot ? colors.brand.primary : colors.brand.light) : colors.bg.primary}
              stroke={colors.border.strong}
              strokeWidth={1}
            />
          );
        })}
        {BLACK_KEYS.map((k) =>
          pitchClasses.includes(k.pc) ? (
            <SvgText
              key={`bl-${k.name}`}
              x={(k.afterWhiteIndex + 1) * WHITE_KEY_WIDTH}
              y={BLACK_KEY_HEIGHT - 10}
              fontSize={9}
              fontFamily="Inter-Bold"
              fill={colors.text.primary}
              textAnchor="middle"
            >
              {k.name}
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
