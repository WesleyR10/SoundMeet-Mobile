import { View, Text, Switch } from 'react-native';
import { Lock } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  locked:  boolean;
  value:   boolean;
  onChange: (next: boolean) => void;
};

// Mesmo idioma de EditQRCodeSection.tsx (locked branch): ícone Lock + texto
// estático explicativo, sem CTA de upgrade (não existe checkout no app
// ainda). Não usa AccordionSection (seu prop `locked` é específico de
// accordion) — TunerScreen é fullscreen, não accordion.
const useStyles = makeStyles((colors) => ({
  root: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
  },
  lockedRoot: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    padding:            spacing.md,
    borderRadius:       radius.md,
    backgroundColor:  'rgba(255,255,255,0.03)',
  },
  lockedText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:   1,
  },
}));

export function TunerNoiseFilterRow({ locked, value, onChange }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  if (locked) {
    return (
      <View style={s.lockedRoot}>
        <Lock size={18} color={colors.text.secondary} />
        <Text style={s.lockedText}>
          Filtro de ruído é exclusivo dos planos Essencial e Pro.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Text style={s.label}>Filtro de ruído</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border.default, true: colors.brand.muted }}
        thumbColor={value ? colors.brand.primary : colors.text.muted}
        accessibilityLabel="Filtro de ruído do afinador"
      />
    </View>
  );
}
