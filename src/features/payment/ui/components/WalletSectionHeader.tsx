import { View, Text } from 'react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';

type Props = {
  title:    string;
  subtitle: string;
};

/**
 * Cabeçalho de seção da Carteira.
 *
 * Existe porque as duas seções (custódia e gorjetas) precisam do **subtítulo**,
 * não só do título: em ambas, a linha de baixo responde "onde esse dinheiro
 * está?" — pergunta que a tela inteira existe para responder desde que a
 * gorjeta passou a liquidar fora da plataforma.
 */
const useStyles = makeStyles((colors) => ({
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color:     colors.text.muted,
    marginTop: 2,
  },
}));

export function WalletSectionHeader({ title, subtitle }: Props) {
  const s = useStyles();
  return (
    <View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );
}
