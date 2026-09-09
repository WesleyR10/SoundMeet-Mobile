import { View, Text, Switch } from 'react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { RadarPulseIndicator } from './RadarPulseIndicator';

type Props = {
  value:    boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  title:     string;
  subtitle:  string;
};

// Linha genérica de opt-in de radar (open_to_gigs) — reaproveitada pelo
// perfil do músico (EditAvailabilitySection) e pela banda
// (BandLeaderSettingsSection). Mesmo padrão de Switch de TunerNoiseFilterRow
// (trackColor/thumbColor via tokens.ts), mas com o selo animado de
// RadarPulseIndicator no lugar de um ícone estático — é o mesmo motivo
// visual em qualquer tela onde "estar visível" é a decisão.
const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    padding:            spacing.md,
    borderRadius:       radius.lg,
    borderWidth:        1,
    borderColor:        colors.border.brand,
    backgroundColor:   'rgba(0,224,184,0.04)',
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

export function AvailabilityToggleRow({ value, onChange, disabled, title, subtitle }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <RadarPulseIndicator active={value} size={40} />
      <View style={s.textCol}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border.default, true: colors.brand.muted }}
        thumbColor={value ? colors.brand.primary : colors.text.muted}
        accessibilityLabel={title}
        accessibilityRole="switch"
      />
    </View>
  );
}
