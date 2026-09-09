import { View, Text, Switch } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  value:    boolean;
  onChange: (next: boolean) => void;
};

// Mesmo padrão de Switch de AvailabilityToggleRow/TunerNoiseFilterRow
// (trackColor/thumbColor via tokens.ts) — espelha reflow de diagrama pra
// canhoto quando ChordDiagram/PianoChordDiagram suportarem espelhamento
// (ver plano, riscos — persistência funciona já, efeito visual é dívida).
const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             spacing.md,
    padding:         spacing.md,
    borderRadius:    radius.lg,
    borderWidth:      1,
    borderColor:     colors.border.default,
  },
  textCol: {
    flex: 1,
    gap:   2,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
}));

export function LeftHandedSwitch({ value, onChange }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <View style={s.textCol}>
        <Text style={s.title}>Canhoto</Text>
        <Text style={s.subtitle}>Espelha os diagramas de acorde pro braço invertido.</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border.default, true: colors.brand.muted }}
        thumbColor={value ? colors.brand.primary : colors.text.muted}
        accessibilityLabel="Canhoto"
        accessibilityRole="switch"
      />
    </View>
  );
}
