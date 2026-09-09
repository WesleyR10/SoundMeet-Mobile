import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  label?: string;
};

const useStyles = makeStyles((colors) => ({
  root: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  line: {
    flex:   1,
    height: 1,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function AuthDivider({ label = 'ou continue com e-mail' }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.root}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', colors.border.default]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.line}
      />
      <Text style={s.label}>{label}</Text>
      <LinearGradient
        colors={[colors.border.default, 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.line}
      />
    </View>
  );
}

