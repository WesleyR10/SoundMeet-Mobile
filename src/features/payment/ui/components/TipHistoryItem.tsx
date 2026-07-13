import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import type { Tip } from '../../domain/tip.types';

type Props = {
  tip:   Tip;
  index: number;
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const STATUS_META: Record<Tip['status'], { icon: typeof Clock; color: string; label: string }> = {
  pending:   { icon: Clock,        color: colors.status.warning, label: 'Pendente' },
  completed: { icon: CheckCircle2, color: colors.status.success, label: 'Confirmada' },
  failed:    { icon: XCircle,      color: colors.status.error,   label: 'Falhou' },
  refunded:  { icon: RotateCcw,    color: colors.text.muted,     label: 'Estornada' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time}`;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Linha do histórico (TipHistoryList) — GlowCard (entrada em cascata, stagger
// por índice, mesmo idioma de BadgeGrid). Sem Pressable3DCard: a linha já
// mostra tudo que existe sobre a gorjeta (valor, fã, mensagem, status, data)
// inline, sem tela/ação de detalhe — envolver num Pressable sem onPress só
// desabilitaria o próprio componente (ver Pressable3DCard.tsx) e nunca
// animaria, deixando um wrapper "3D" morto/enganoso.
export function TipHistoryItem({ tip, index }: Props) {
  const meta = STATUS_META[tip.status];
  const StatusIcon = meta.icon;

  return (
    <GlowCard accentColor={colors.accent.coral} riseDelay={index * 60} style={s.card}>
      <View style={s.row}>
        <View style={s.iconBox}>
          <StatusIcon size={18} color={meta.color} />
        </View>

        <View style={s.info}>
          <Text style={s.amount}>{formatBRL(tip.amount)}</Text>
          {tip.message ? (
            <Text style={s.message} numberOfLines={2}>{tip.is_anonymous ? 'Fã anônimo' : 'Um fã'} — {tip.message}</Text>
          ) : (
            <Text style={s.message}>{tip.is_anonymous ? 'Fã anônimo' : 'Um fã'}</Text>
          )}
        </View>

        <View style={s.meta}>
          <Text style={[s.status, { color: meta.color }]}>{meta.label}</Text>
          <Text style={s.date}>{formatDate(tip.created_at)}</Text>
        </View>
      </View>
    </GlowCard>
  );
}

const s = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  iconBox: {
    width:            36,
    height:           36,
    borderRadius:     radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  info: {
    flex: 1,
    gap:  2,
  },
  amount: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  message: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  meta: {
    alignItems: 'flex-end',
    gap:         2,
  },
  status: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  date: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
