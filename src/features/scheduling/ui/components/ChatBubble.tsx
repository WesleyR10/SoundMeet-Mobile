import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, CheckCheck } from 'lucide-react-native';
import { colors, gradients, spacing, radius, typography } from '@/shared/design-system/tokens';
import { formatHHMM } from '@/shared/utils/date-format';
import type { ChatMessage } from '../../domain/conversation.types';

type Props = {
  message: ChatMessage;
  isOwn:   boolean;
};

// "Própria" bolha decidida por sender_id === userId (não por sender_type
// string) — resolveSender() no backend atribui sender_id = userId pro papel
// musician, então isso bate exatamente com o Keycloak sub. Tick de
// status: só 'sent'/'read' são de fato alcançáveis hoje ('delivered' está
// tipado no backend mas nenhum use-case o produz ainda). Bolha própria usa
// gradiente `brand` (não cor chapada) — mesmo tratamento já dado a
// superfícies de destaque no resto do app (CTA de salvar, card de próximo
// show nos mockups de referência).
export function ChatBubble({ message, isOwn }: Props) {
  const footer = (
    <View style={s.footer}>
      <Text style={[s.time, isOwn && s.timeOwn]}>{formatHHMM(message.created_at)}</Text>
      {isOwn && (
        message.status === 'read'
          ? <CheckCheck size={14} color={colors.text.inverse} />
          : <Check size={14} color={`${colors.text.inverse}8C`} />
      )}
    </View>
  );

  return (
    <View style={[s.row, isOwn ? s.rowOwn : s.rowOther]}>
      {isOwn ? (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.bubble, s.bubbleOwn]}>
          <Text style={[s.content, s.contentOwn]}>{message.content}</Text>
          {footer}
        </LinearGradient>
      ) : (
        <View style={[s.bubble, s.bubbleOther]}>
          <Text style={[s.content, s.contentOther]}>{message.content}</Text>
          {footer}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom:   spacing.sm,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth:          '80%',
    borderRadius:      radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    gap:                4,
  },
  bubbleOwn: {
    borderBottomRightRadius: radius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.bg.elevated,
    borderWidth:      1,
    borderColor:      colors.border.default,
    borderBottomLeftRadius: radius.sm,
  },
  content: {
    ...typography.body,
  },
  contentOwn: {
    color: colors.text.inverse,
  },
  contentOther: {
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems:    'center',
    alignSelf:     'flex-end',
    gap:            4,
  },
  time: {
    ...typography.caption,
    color: colors.text.muted,
  },
  timeOwn: {
    color: `${colors.text.inverse}8C`,
  },
});
