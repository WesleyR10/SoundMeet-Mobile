import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { expiryLabel, isBandInquiry, statusLabel, statusTone, type StatusTone } from '../../domain/inquiry.rules';
import type { Inquiry } from '../../domain/inquiry.types';

type Props = {
  inquiry:           Inquiry;
  establishmentName: string | null;
  onPress:           () => void;
  riseDelay?:        number;
};

/** O domínio devolve tom semântico; a cor mora aqui, que é a camada de UI. */
const TONE_COLOR: Record<StatusTone, string> = {
  pending:  colors.accent.amber,
  positive: colors.status.success,
  negative: colors.status.error,
  neutral:  colors.text.muted,
};

/**
 * Linha da lista de propostas.
 *
 * `establishmentName` chega de fora e pode ser `null`: o `InquiryPresenter` só
 * traz `establishment_id`, e resolver o nome por linha seria um N+1 na
 * listagem. Degrada para um rótulo genérico em vez de exibir um UUID — mesma
 * decisão de `ConversationListItem` quando o enriquecimento falha.
 */
export function InquiryCard({ inquiry, establishmentName, onPress, riseDelay = 0 }: Props) {
  const tone = statusTone(inquiry);
  const expiry = expiryLabel(inquiry);
  const name = establishmentName ?? 'Estabelecimento';

  return (
    <Pressable3DCard onPress={onPress} accessibilityLabel={`Ver proposta de ${name}`}>
      <GlowCard accentColor={colors.accent.violet} riseDelay={riseDelay} style={s.card}>
        <View style={s.headerRow}>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
          <View style={[s.statusPill, { borderColor: TONE_COLOR[tone] }]}>
            <Text style={[s.statusText, { color: TONE_COLOR[tone] }]}>{statusLabel(inquiry)}</Text>
          </View>
        </View>

        {!!inquiry.subject && (
          <Text style={s.subject} numberOfLines={1}>{inquiry.subject}</Text>
        )}

        {!!inquiry.initial_message && (
          <Text style={s.message} numberOfLines={2}>{inquiry.initial_message}</Text>
        )}

        <View style={s.footerRow}>
          {isBandInquiry(inquiry) && (
            <View style={s.bandTag}>
              <Users size={12} color={colors.text.muted} />
              {/* Só o líder decide (403 para os demais) — avisar aqui evita que
                  o membro comum descubra isso só ao apertar o botão. */}
              <Text style={s.bandText}>Para a banda</Text>
            </View>
          )}
          {!!expiry && <Text style={s.expiry}>{expiry}</Text>}
        </View>
      </GlowCard>
    </Pressable3DCard>
  );
}

const s = StyleSheet.create({
  card: {
    gap:     spacing.sm,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flex:       1,
  },
  statusPill: {
    borderWidth:        1,
    borderRadius:       radius.full,
    paddingHorizontal:  spacing.sm,
    paddingVertical:    2,
  },
  statusText: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
  },
  subject: {
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
    color:      colors.text.secondary,
  },
  message: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  bandTag: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  bandText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  expiry: {
    ...typography.caption,
    color:      colors.accent.amber,
    marginLeft: 'auto',
  },
});
