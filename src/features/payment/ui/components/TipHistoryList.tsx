import { View, Text, ActivityIndicator } from 'react-native';
import { Music2 } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useTips } from '../../application/useTips';
import { TipHistoryItem } from './TipHistoryItem';

type Props = {
  musicianId: string | null;
};

const useStyles = makeStyles((colors) => ({
  list: {
    gap: spacing.sm,
  },
  centerBox: {
    alignItems:        'center',
    justifyContent:    'center',
    gap:                 spacing.sm,
    paddingVertical:     spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
}));

export function TipHistoryList({ musicianId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { data, isPending, isError } = useTips(musicianId);

  if (isPending) {
    return (
      <View style={s.centerBox}>
        <ActivityIndicator color={colors.accent.coral} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={s.centerBox}>
        <Text style={s.emptyText}>Não conseguimos carregar seu histórico de gorjetas.</Text>
      </View>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <View style={s.centerBox}>
        <Music2 size={28} color={colors.text.muted} />
        <Text style={s.emptyText}>Nenhuma gorjeta ainda — compartilhe seu QR Code pra começar a receber.</Text>
      </View>
    );
  }

  return (
    <View style={s.list}>
      {data.items.map((tip, index) => (
        <TipHistoryItem key={tip.id} tip={tip} index={index} />
      ))}
    </View>
  );
}
