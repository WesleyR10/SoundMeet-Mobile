import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  message: string;
  style?:  StyleProp<ViewStyle>;
};

/*
 * Primeiro componente migrado para `makeStyles` (05/set/2026). O padrão:
 * `spacing`/`radius`/`typography` continuam vindo de `tokens` (não mudam com o
 * tema); só `colors` passa pela fábrica. A cor do ícone vem de `useTheme`
 * porque é prop de componente, não folha de estilo.
 */
const useStyles = makeStyles((colors) => ({
  banner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              spacing.sm,
    borderRadius:     radius.md,
    borderWidth:      1,
    borderColor:      `${colors.status.error}59`,
    backgroundColor: `${colors.status.error}14`,
    padding:          spacing.md,
  },
  bannerText: {
    ...typography.bodySm,
    color: colors.text.primary,
    flex:  1,
  },
}));

export function ErrorBanner({ message, style }: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  return (
    <View style={[s.banner, style]}>
      <AlertCircle size={18} color={colors.status.error} strokeWidth={2} />
      <Text style={s.bannerText}>{message}</Text>
    </View>
  );
}
