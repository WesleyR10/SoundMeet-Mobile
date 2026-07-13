import { View, Text, StyleSheet } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { Avatar } from '@/shared/components/Avatar';
import { formatListPreviewTime } from '@/shared/utils/date-format';
import type { Conversation } from '../../domain/conversation.types';

type Props = {
  conversation: Conversation;
  onPress:      () => void;
  riseDelay?:   number;
};

// Linha da ConversationListScreen (Bloco 9) — anel gradiente teal+violeta
// (design-system.md: "Teal + Violeta → sofisticado, profundo, premium" —
// a combinação da própria paleta de marca pra "momentos especiais"),
// preview da última mensagem, dot de não lidas. Establishment pode ser null
// (enriquecimento do backend falhou em resolver o estabelecimento) —
// degrada pra um nome genérico em vez de quebrar a linha.
export function ConversationListItem({ conversation, onPress, riseDelay = 0 }: Props) {
  const name = conversation.establishment?.name ?? 'Estabelecimento';
  const hasUnread = conversation.unread_count > 0;

  return (
    <Pressable3DCard onPress={onPress} accessibilityLabel={`Abrir conversa com ${name}`}>
      <GlowCard accentColor={colors.accent.violet} riseDelay={riseDelay} style={s.card}>
        <Avatar
          uri={conversation.establishment?.avatar}
          size={48}
          fallbackIcon={Building2}
          ringColors={[colors.accent.violet, colors.brand.primary]}
        />

        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
          <Text style={[s.preview, hasUnread && s.previewUnread]} numberOfLines={1}>
            {conversation.last_message?.content ?? 'Nenhuma mensagem ainda'}
          </Text>
        </View>

        <View style={s.meta}>
          {conversation.last_message && (
            <Text style={s.time}>{formatListPreviewTime(conversation.last_message.created_at)}</Text>
          )}
          {hasUnread && (
            <View style={s.unreadDot}>
              <Text style={s.unreadCount}>{conversation.unread_count > 9 ? '9+' : conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </GlowCard>
    </Pressable3DCard>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    padding:        spacing.md,
  },
  info: {
    flex: 1,
    gap:  2,
  },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  preview: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  previewUnread: {
    color:      colors.text.primary,
    fontFamily: 'Inter-Medium',
  },
  meta: {
    alignItems: 'flex-end',
    gap:         spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.text.muted,
  },
  unreadDot: {
    minWidth:          18,
    height:            18,
    borderRadius:      radius.full,
    paddingHorizontal: 5,
    backgroundColor:   colors.brand.primary,
    alignItems:        'center',
    justifyContent:    'center',
  },
  unreadCount: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
    fontSize:   10,
  },
});
