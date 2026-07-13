import { useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { spacing } from '@/shared/design-system/tokens';
import { ChatBubble } from './ChatBubble';
import type { ChatMessage } from '../../domain/conversation.types';

type Props = {
  messages: ChatMessage[];
  userId:   string | null;
};

// Não invertida de propósito: o backend pagina mensagens em ordem
// created_at ASC (mais antiga → mais nova), e o cursor avança pra
// mensagens MAIS RECENTES, não mais antigas — o oposto do que uma lista
// invertida com "carregar mais ao rolar pra cima" precisaria. Pro volume
// esperado do MVP (useChat.ts busca até 100 numa página só), renderizar em
// ordem natural + scroll automático pro fim já cobre o caso real.
//
// Um único gatilho de scroll (onContentSizeChange, não também um useEffect
// em messages.length) — os dois disparavam pro mesmo evento (nova mensagem
// renderizada) e competiam entre si (achado em revisão: o useEffect podia
// rodar antes do FlatList terminar de fazer layout do novo item, brigando
// com o scrollToEnd disparado por onContentSizeChange logo em seguida).
export function ChatMessageList({ messages, userId }: Props) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  return (
    <FlatList<ChatMessage>
      ref={listRef}
      style={s.list}
      data={messages}
      keyExtractor={(item) => item.message_id}
      contentContainerStyle={s.content}
      renderItem={({ item }) => <ChatBubble message={item} isOwn={item.sender_id === userId} />}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
    />
  );
}

const s = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.lg,
  },
});
