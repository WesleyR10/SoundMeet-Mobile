import { View, Text, StyleSheet } from 'react-native';
import { Coins } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  activeMemberCount: number;
};

// Descreve a REGRA de split, não um extrato financeiro — o backend credita a
// parte de cada membro direto na wallet individual dele via Transaction
// (confirm-tip-payment.use-case.ts), sem gerar um registro de "gorjeta de
// banda" consultável por membro. Ver GET /musicians/:id/wallet — já mostra
// o saldo agregado (inclui splits recebidos), mas sem discriminar a origem.
// Um extrato dedicado por banda fica pra v2 (exigiria endpoint novo no
// backend); aqui mostramos a regra, que já é 100% real e verificável.
export function BandTipSplitCard({ activeMemberCount }: Props) {
  const sharePct = activeMemberCount > 0 ? Math.round(100 / activeMemberCount) : 0;

  return (
    <View style={s.card}>
      <View style={s.iconBox}>
        <Coins size={18} color={colors.status.success} />
      </View>
      <View style={s.textCol}>
        <Text style={s.title}>Divisão de gorjetas</Text>
        <Text style={s.body}>
          {activeMemberCount > 0
            ? `Gorjetas enviadas para a banda são divididas igualmente entre os ${activeMemberCount} membros ativos — cerca de ${sharePct}% para cada um, creditado direto na carteira individual.`
            : 'Sem membros ativos, gorjetas para a banda não podem ser processadas.'}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection:   'row',
    gap:              spacing.md,
    padding:          spacing.lg,
    borderRadius:     radius.lg,
    borderWidth:      1,
    borderColor:      colors.border.default,
    backgroundColor:  'rgba(255,255,255,0.03)',
  },
  iconBox: {
    width:           32,
    height:          32,
    borderRadius:    radius.sm,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: `${colors.status.success}14`,
  },
  textCol: {
    flex: 1,
    gap:   spacing.xs,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  body: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
});
