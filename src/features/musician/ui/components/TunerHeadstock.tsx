import { Dimensions, View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors } from '@/shared/design-system/tokens';

const SW = Dimensions.get('window').width;
const WIDTH  = Math.min(SW * 0.44, 190);
const HEIGHT = WIDTH * 1.45;

// Posições (viewBox 0 0 200 290) — 3+3 clássico como na referência.
const PEG_LEFT_X  = 42;
const PEG_RIGHT_X = 158;
export const PEG_YS = [70, 130, 190] as const;

// Headstock de guitarra em wireframe (SVG estático) — centro do modo
// guitarra do afinador. Sem Skia (decisão 10/07/2026): stroke simples +
// "glow" com segunda passada de stroke translúcido, mesma técnica dos
// arcos de WizardProgress/TunerCentsMeter.
export function TunerHeadstock() {
  const outline = 'M68 14 Q100 4 132 14 L150 262 Q100 278 50 262 Z';

  return (
    <View style={s.root}>
      <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 200 290">
        {/* glow atrás do contorno */}
        <Path d={outline} stroke={colors.brand.glow} strokeWidth={7} fill="none" />
        <Path d={outline} stroke={colors.border.strong} strokeWidth={2} fill="rgba(0,224,184,0.03)" />

        {/* nut (pestana) */}
        <Line x1={56} y1={258} x2={144} y2={258} stroke={colors.border.strong} strokeWidth={3} />

        {/* cordas: da pestana até o tarraxal correspondente (6ª..1ª) */}
        {[
          { x: 75,  peg: { x: PEG_LEFT_X + 14,  y: PEG_YS[2] } },
          { x: 85,  peg: { x: PEG_LEFT_X + 14,  y: PEG_YS[1] } },
          { x: 95,  peg: { x: PEG_LEFT_X + 14,  y: PEG_YS[0] } },
          { x: 105, peg: { x: PEG_RIGHT_X - 14, y: PEG_YS[0] } },
          { x: 115, peg: { x: PEG_RIGHT_X - 14, y: PEG_YS[1] } },
          { x: 125, peg: { x: PEG_RIGHT_X - 14, y: PEG_YS[2] } },
        ].map((string, i) => (
          <Line
            key={i}
            x1={string.x}
            y1={258}
            x2={string.peg.x}
            y2={string.peg.y}
            stroke={colors.text.muted}
            strokeWidth={1.2}
          />
        ))}

        {/* tarraxas (postes) e botões externos */}
        {PEG_YS.map((y) => (
          <Circle key={`l${y}`} cx={PEG_LEFT_X + 14} cy={y} r={7} stroke={colors.border.strong} strokeWidth={2} fill={colors.bg.elevated} />
        ))}
        {PEG_YS.map((y) => (
          <Circle key={`r${y}`} cx={PEG_RIGHT_X - 14} cy={y} r={7} stroke={colors.border.strong} strokeWidth={2} fill={colors.bg.elevated} />
        ))}
        {PEG_YS.map((y) => (
          <Line key={`lb${y}`} x1={PEG_LEFT_X + 7} y1={y} x2={PEG_LEFT_X - 10} y2={y} stroke={colors.border.strong} strokeWidth={4} strokeLinecap="round" />
        ))}
        {PEG_YS.map((y) => (
          <Line key={`rb${y}`} x1={PEG_RIGHT_X - 7} y1={y} x2={PEG_RIGHT_X + 10} y2={y} stroke={colors.border.strong} strokeWidth={4} strokeLinecap="round" />
        ))}
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});
