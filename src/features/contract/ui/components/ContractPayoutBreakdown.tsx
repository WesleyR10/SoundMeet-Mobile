import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { payoutFeePercentage, type ContractPayout } from '../../domain/payout.types';

type Props = {
  payout: ContractPayout | null;
  /** Versão de uma linha, para caber no sheet de assinatura. */
  compact?: boolean;
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Sem casa decimal quando é redondo: "10%", não "10,0%". */
function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

/**
 * 🔴 **A informação que a cláusula de pagamento pressupõe.**
 *
 * O texto do contrato não traz o percentual — ele remete ao que foi "informado
 * às partes e vigente na data de emissão deste instrumento". Essa redação é o
 * que permite reajustar a tabela sem abrir uma nova versão de template, mas ela
 * só se sustenta se o número **tiver sido de fato informado** antes do aceite.
 * Este componente é esse cumprimento; sem ele a cláusula remete ao nada.
 *
 * Os valores vêm congelados da custódia daquele show, não da tabela de hoje —
 * ver `payout.types.ts`.
 *
 * Não renderiza nada quando não há custódia: aí o pagamento não passa pela
 * plataforma e não há comissão a informar. Inventar "0%" afirmaria algo sobre
 * um acerto que é entre o músico e a casa.
 */
export function ContractPayoutBreakdown({ payout, compact = false }: Props) {
  if (!payout) return null;

  const percent = formatPercent(payoutFeePercentage(payout));

  if (compact) {
    return (
      <Text style={s.compact}>
        Cachê {formatBRL(payout.amount)} · taxa {percent} · você recebe{' '}
        <Text style={s.compactNet}>{formatBRL(payout.net_amount)}</Text>
      </Text>
    );
  }

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <ShieldCheck size={15} color={colors.brand.primary} />
        <Text style={s.title}>O que você recebe</Text>
      </View>

      <Row label="Cachê acordado" value={formatBRL(payout.amount)} />
      <Row label={`Taxa da plataforma (${percent})`} value={`− ${formatBRL(payout.platform_fee)}`} />

      <View style={s.divider} />

      <View style={s.row}>
        <Text style={s.netLabel}>Você recebe</Text>
        <Text style={s.netValue}>{formatBRL(payout.net_amount)}</Text>
      </View>

      <Text style={s.note}>
        Taxa vigente na emissão deste contrato — um reajuste posterior não muda este show.
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.default,
    padding:         spacing.md,
    gap:             spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  title: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            spacing.md,
  },
  label: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:  1,
  },
  value: {
    ...typography.bodySm,
    color: colors.text.primary,
  },
  divider: {
    height:          1,
    backgroundColor: colors.border.default,
  },
  netLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flex:       1,
  },
  netValue: {
    ...typography.title,
    color: colors.brand.primary,
  },
  note: {
    ...typography.caption,
    color: colors.text.muted,
  },
  compact: {
    ...typography.bodySm,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  compactNet: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
});
