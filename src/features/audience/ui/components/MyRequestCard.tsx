import { View, Text, StyleSheet } from 'react-native';
import { Music2, Sparkles } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import type { AudienceRequest } from '../../domain/request.types';
import {
  boostBadge,
  requestStatusLabel,
  requestStatusTone,
  type RequestTone,
} from '../../domain/request.rules';

type Props = {
  request: AudienceRequest;
  riseDelay?: number;
  /** Só chamado quando há PIX pendente — ver `boostBadge().actionable`. */
  onResumePayment?: (request: AudienceRequest) => void;
};

const TONE_COLOR: Record<RequestTone, string> = {
  pending: colors.accent.amber,
  positive: colors.status.success,
  live: colors.brand.primary,
  negative: colors.text.muted,
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Quanto tempo faz, em português curto.
 *
 * Data absoluta ("05/09 às 20:14") não é o que o fã quer saber num histórico de
 * pedidos: a pergunta é "faz muito tempo que pedi?". Formatador local, sem lib
 * de data — nenhuma está instalada e o app não precisa de fuso aqui, só de
 * diferença.
 */
function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'ontem' : `há ${days} dias`;
}

export function MyRequestCard({ request, riseDelay, onResumePayment }: Props) {
  const badge = boostBadge(request);
  const tone = requestStatusTone(request);
  const toneColor = TONE_COLOR[tone];

  // Só vira cartão tocável quando há algo a fazer. Um card que "afunda" ao
  // toque e não leva a lugar nenhum promete uma ação inexistente — mesma razão
  // pela qual a tile "Meus Pedidos" ficou desabilitada enquanto a tela não
  // existia, em vez de navegar para um placeholder.
  const actionable = !!badge?.actionable && !!onResumePayment;

  const content = (
    <GlowCard
      accentColor={badge?.actionable ? colors.accent.coral : colors.accent.violet}
      riseDelay={riseDelay}
      style={s.card}
    >
      <View style={s.headerRow}>
        <View style={s.iconWrap}>
          <Music2 size={18} color={colors.accent.violet} />
        </View>

        <View style={s.titleBlock}>
          <Text style={s.song} numberOfLines={1}>{request.song_title}</Text>
          {!!request.artist && (
            <Text style={s.artist} numberOfLines={1}>{request.artist}</Text>
          )}
        </View>

        <Text style={s.time}>{timeAgo(request.created_at)}</Text>
      </View>

      <View style={s.footerRow}>
        <View style={[s.statusPill, { borderColor: `${toneColor}66` }]}>
          <View style={[s.statusDot, { backgroundColor: toneColor }]} />
          <Text style={[s.statusText, { color: toneColor }]}>{requestStatusLabel(request)}</Text>
        </View>

        {!!badge && (
          <View
            style={[
              s.boostPill,
              badge.actionable ? s.boostPillActionable : s.boostPillNeutral,
            ]}
          >
            <Sparkles
              size={13}
              color={badge.actionable ? colors.accent.coral : colors.accent.amber}
              strokeWidth={2.2}
            />
            <Text
              style={[
                s.boostText,
                { color: badge.actionable ? colors.accent.coral : colors.accent.amber },
              ]}
            >
              {badge.label} · {formatBRL(badge.amount)}
            </Text>
          </View>
        )}
      </View>
    </GlowCard>
  );

  if (!actionable) return content;

  return (
    <Pressable3DCard
      onPress={() => onResumePayment?.(request)}
      accessibilityLabel={`Concluir o PIX do destaque de ${request.song_title}`}
    >
      {content}
    </Pressable3DCard>
  );
}

const s = StyleSheet.create({
  card: { gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent.violet}24`,
  },
  titleBlock: { flex: 1, gap: 2 },
  song: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  time: {
    ...typography.caption,
    color: colors.text.muted,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  statusDot: { width: 6, height: 6, borderRadius: radius.full },
  statusText: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  boostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  boostPillActionable: {
    borderColor: `${colors.accent.coral}66`,
    backgroundColor: `${colors.accent.coral}14`,
  },
  boostPillNeutral: {
    borderColor: `${colors.accent.amber}55`,
  },
  boostText: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
});
