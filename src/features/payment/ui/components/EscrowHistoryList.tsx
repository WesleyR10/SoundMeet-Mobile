import { View, Text, ActivityIndicator } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useEscrows } from '../../application/useEscrows';
import { EscrowHistoryItem } from './EscrowHistoryItem';

type Props = {
  musicianId: string | null;
};

/**
 * Extrato de custódias.
 *
 * O estado vazio explica a feature em vez de só dizer "nada aqui": custódia é
 * um conceito que o músico encontra pela primeira vez nesta tela, e ele precisa
 * saber que ela existe ANTES de fechar um show — é o argumento que faz aceitar
 * um contrato pela plataforma em vez de combinar por fora.
 */
const useStyles = makeStyles((colors) => ({
  list: {
    gap: spacing.sm,
  },
  centerBox: {
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
}));

export function EscrowHistoryList({ musicianId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { data, isPending, isError } = useEscrows(musicianId);

  if (isPending) {
    return (
      <View style={s.centerBox}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={s.centerBox}>
        <Text style={s.emptyText}>Não conseguimos carregar seus cachês em custódia.</Text>
      </View>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <View style={s.centerBox}>
        <ShieldCheck size={28} color={colors.text.muted} />
        <Text style={s.emptyText}>
          Nenhum cachê em custódia. Quando um show for contratado pelo app, o valor fica
          garantido antes da apresentação e é liberado depois dela.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.list}>
      {data.items.map((escrow, index) => (
        <EscrowHistoryItem key={escrow.id} escrow={escrow} index={index} />
      ))}
    </View>
  );
}
