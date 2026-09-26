import { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useChat, useSendMessage } from '../../application/useChat';
import { useConversationOffer, useRespondToOffer } from '../../application/useBookingOffer';
import { useChatSocket } from '../../application/useChatSocket';
import { useMarkAsRead } from '../../application/useMarkAsRead';
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessageList } from '../components/ChatMessageList';
import { ChatInputBar } from '../components/ChatInputBar';
import { ProposalCard } from '../components/ProposalCard';
import type { RootScreenProps } from '@/navigation/types';
import { ThemedStatusBar } from '@/shared/components/ThemedStatusBar';

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
const useStyles = makeStyles((colors) => ({
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
}));

export function ChatScreen({ route, navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { conversationId, establishmentName, establishmentAvatar } = route.params;
  const userId = useAuthStore((s) => s.user?.userId ?? null);
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const { data, isPending, isError, refetch } = useChat(conversationId);
  const sendMessage = useSendMessage(conversationId, userId);
  const markAsRead = useMarkAsRead(conversationId, musicianId);

  // A proposta de show em jogo (18/set/2026) — o que o artista aceita ou
  // recusa aqui mesmo. `null` enquanto a conversa não virou proposta.
  const { offer, refresh: refreshOffer } = useConversationOffer(data?.conversation);
  const respond = useRespondToOffer(conversationId);

  // `userId` decide se um message.new recebido é eco da própria mensagem
  // (ignorado, useSendMessage.onSuccess já reconcilia) ou de fato do outro
  // lado da conversa — só nesse segundo caso marcamos como lida. Mensagem da
  // casa também recarrega a proposta: é assim que chega uma proposta nova ou
  // ajustada pelo painel (ela entra no fio junto com o registro em texto).
  useChatSocket(conversationId, userId, () => {
    markAsRead.mutate();
    refreshOffer();
  });

  useEffect(() => {
    markAsRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function renderBody() {
    if (isPending) {
      /*
       * 🔴 A ÚNICA tela que fica com spinner, e é decisão — não esquecimento.
       *
       * Um esqueleto de chat teria de adivinhar quantas mensagens existem, de
       * que lado cada bolha cai e que altura cada uma tem. Erra sempre: a
       * conversa pode ter duas mensagens ou duzentas, e a lista é invertida
       * (abre no fim). O resultado seria um layout falso que se reorganiza
       * inteiro na chegada dos dados — exatamente o salto que o esqueleto
       * existe para evitar, com mais movimento que o spinner.
       */
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
      <ThemedStatusBar />
      <AmbientGlowBackground glows={CHAT_GLOWS} />

      <ChatHeader
        onBack={() => navigation.goBack()}
        name={establishmentName}
        avatar={establishmentAvatar}
        establishmentId={data?.conversation.establishment_id ?? null}
      />

      {offer ? (
        <ProposalCard
          offer={offer}
          accepting={respond.accept.isPending}
          declining={respond.decline.isPending}
          errorMessage={respond.errorMessage}
          onAccept={() => respond.accept.mutate(offer)}
          onDecline={() => respond.decline.mutate(offer)}
        />
      ) : null}

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
