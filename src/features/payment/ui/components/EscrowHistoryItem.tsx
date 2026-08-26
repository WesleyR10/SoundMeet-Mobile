import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle2, Lock, RotateCcw, TriangleAlert } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import type { BookingEscrow, EscrowStatus } from '../../domain/escrow.types';

type Props = {
  escrow: BookingEscrow;
  index:  number;
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Rótulo em linguagem de músico, não de gateway.
 *
 * "Retido" descreve o que o sistema fez; "garantido, libera após o show"
 * descreve o que importa para quem vai receber — e é a diferença entre a tela
 * parecer um bloqueio e parecer uma proteção.
 */
const STATUS_META: Record<
  EscrowStatus,
  { icon: typeof Clock; color: string; label: string; hint: string }
> = {
  pending: {
    icon:  Clock,
    color: colors.status.warning,
    label: 'Aguardando pagamento',
    hint:  'A casa ainda não pagou o cachê',
  },
  held: {
    icon:  Lock,
    color: colors.brand.primary,
    label: 'Garantido',
    // A liberação exige DUAS coisas — registrar a apresentação e o prazo de
    // contestação vencer. Dizer só "liberado após o show" faria quem tocou
    // ontem esperar o dinheiro hoje e abrir chamado quando não caísse.
    hint:  'Pago e guardado — libera após o check-in e o prazo de contestação',
  },
  released: {
    icon:  CheckCircle2,
    color: colors.status.success,
    label: 'Liberado',
    hint:  'Já está no seu saldo disponível',
  },
  refunded: {
    icon:  RotateCcw,
    color: colors.text.muted,
    label: 'Devolvido',
    hint:  'O valor voltou para o estabelecimento',
  },
  disputed: {
    icon:  TriangleAlert,
    color: colors.status.error,
    label: 'Em contestação',
    hint:  'A casa abriu uma disputa — em mediação',
  },
};

/** Status em que `resolution_note` é dirigido ao artista. */
const SHOWS_RESOLUTION_NOTE = new Set<EscrowStatus>(['refunded', 'disputed']);

/** A data que responde à pergunta que aquele status levanta. */
function relevantDate(escrow: BookingEscrow): string {
  return escrow.released_at ?? escrow.refunded_at ?? escrow.held_at ?? escrow.created_at;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Uma custódia na lista.
 *
 * Mostra o **líquido** em destaque e o bruto/comissão como detalhe: é o valor
 * que de fato entra na conta do músico, e é o número que ele confere. Exibir o
 * bruto grande criaria uma expectativa que a liberação não cumpre.
 *
 * Sem `Pressable3DCard`: não existe tela de detalhe de custódia, e envolver num
 * `Pressable` sem `onPress` deixaria um wrapper "3D" morto (ver
 * `TipHistoryItem`, mesma decisão).
 */
export function EscrowHistoryItem({ escrow, index }: Props) {
  const meta = STATUS_META[escrow.status];
  const StatusIcon = meta.icon;

  return (
    <GlowCard accentColor={meta.color} riseDelay={index * 60} style={s.card}>
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: `${meta.color}20` }]}>
          <StatusIcon size={18} color={meta.color} />
        </View>

        <View style={s.info}>
          <Text style={s.amount}>{formatBRL(escrow.net_amount)}</Text>
          <Text style={s.hint} numberOfLines={2}>{meta.hint}</Text>
        </View>

        <View style={s.tail}>
          <Text style={[s.status, { color: meta.color }]}>{meta.label}</Text>
          {/*
            A data que importa muda com o status: numa custódia liberada, a
            pergunta é "quando caiu?", não "quando foi criada?". Mostrar sempre
            `created_at` faria um cachê liberado hoje parecer de semanas atrás.
          */}
          <Text style={s.date}>{formatDate(relevantDate(escrow))}</Text>
        </View>
      </View>

      <View style={s.breakdown}>
        <Text style={s.breakdownText}>
          Cachê {formatBRL(escrow.amount)} · taxa {formatBRL(escrow.platform_fee)}
        </Text>
      </View>

      {/*
        O motivo só é exibido em estorno e contestação — nesses dois casos ele
        é a informação mais importante do card.

        ⚠️ `resolution_note` NÃO é exclusivo deles: a liberação automática
        também grava lá ("Liberação automática: apresentação registrada e prazo
        de contestação vencido"), e a mediação grava a justificativa INTERNA de
        quem mediou. Mostrar em todo status encheria o extrato de texto de
        sistema e serviria ao artista uma nota operacional escrita para outro
        público.
      */}
      {!!escrow.resolution_note && SHOWS_RESOLUTION_NOTE.has(escrow.status) && (
        <Text style={s.note} numberOfLines={3}>{escrow.resolution_note}</Text>
      )}
    </GlowCard>
  );
}

const s = StyleSheet.create({
  card: {
    gap:     spacing.sm,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
  },
  iconBox: {
    width:          36,
    height:         36,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap:  2,
  },
  amount: {
    ...typography.bodyLg,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  tail: {
    alignItems: 'flex-end',
    gap:        2,
  },
  status: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  date: {
    ...typography.caption,
    color: colors.text.muted,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop:     spacing.sm,
  },
  breakdownText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
