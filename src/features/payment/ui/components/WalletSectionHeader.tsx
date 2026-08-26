import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';

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
export function WalletSectionHeader({ title, subtitle }: Props) {
  return (
    <View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );
}

const s = StyleSheet.create({
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
});
