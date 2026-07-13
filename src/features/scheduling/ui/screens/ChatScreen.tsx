import { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useChat, useSendMessage } from '../../application/useChat';
import { useChatSocket } from '../../application/useChatSocket';
import { useMarkAsRead } from '../../application/useMarkAsRead';
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessageList } from '../components/ChatMessageList';
import { ChatInputBar } from '../components/ChatInputBar';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'Chat'>;

// Único glow, contido perto do header — restrito de propósito (ao contrário
// de ConversationListScreen/HomeScreen, que usam o padrão de 2 glows dos
// mockups de referência). Uma tela de mensagens prioriza legibilidade do
// conteúdo sobre o tratamento ambiente completo.
const CHAT_GLOWS = [
  { color: 'rgba(124,58,237,0.10)', size: 260, top: -90, right: -80, duration: 9000 },
];

// Chat individual músico ↔ estabelecimento (Bloco 9) — orquestra dados
// (useChat) + realtime (useChatSocket, escopo de tela) + leitura
// (useMarkAsRead, disparada no mount e a cada mensagem nova recebida de
// QUEM NÃO SOMOS NÓS — ver o callback passado a useChatSocket abaixo).
export function ChatScreen({ route, navigation }: Props) {
  const { conversationId, establishmentName, establishmentAvatar } = route.params;
  const userId = useAuthStore((s) => s.user?.userId ?? null);
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const { data, isPending, isError, refetch } = useChat(conversationId);
  const sendMessage = useSendMessage(conversationId, userId);
  const markAsRead = useMarkAsRead(conversationId, musicianId);

  // `userId` decide se um message.new recebido é eco da própria mensagem
  // (ignorado, useSendMessage.onSuccess já reconcilia) ou de fato do outro
  // lado da conversa — só nesse segundo caso marcamos como lida.
  useChatSocket(conversationId, userId, () => markAsRead.mutate());

  useEffect(() => {
    markAsRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }

    if (isError || !data) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar essa conversa." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return <ChatMessageList messages={data.messages} userId={userId} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <AmbientGlowBackground glows={CHAT_GLOWS} />

      <ChatHeader
        onBack={() => navigation.goBack()}
        name={establishmentName}
        avatar={establishmentAvatar}
        establishmentId={data?.conversation.establishment_id ?? null}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.body}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {renderBody()}
        <ChatInputBar
          onSend={(content) => sendMessage.mutate(content)}
          isSending={sendMessage.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  body: {
    flex: 1,
  },
  centerRoot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.md,
    padding:          spacing.xl,
  },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
});
