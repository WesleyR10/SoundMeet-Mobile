import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  ChatMessage,
  Conversation,
  ConversationEstablishment,
  ConversationMessagesPage,
} from '../domain/conversation.types';

// GET /conversations — lista as conversas do músico autenticado, já
// enriquecidas (establishment/last_message/unread_count) pelo controller.
export async function listConversations(): Promise<{ conversations: Conversation[] }> {
  const { data } = await httpClient.get<ApiEnvelope<{ conversations: Conversation[] }>>(
    '/conversations',
  );
  return data.data;
}

// GET /conversations/:id/messages — cursor pagination (limit default 50 no
// backend, mesmo assim explicitado aqui pra ficar claro no call site).
export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit = 50,
): Promise<ConversationMessagesPage> {
  const { data } = await httpClient.get<ApiEnvelope<ConversationMessagesPage>>(
    `/conversations/${conversationId}/messages`,
    { params: { cursor, limit } },
  );
  return data.data;
}

// POST /conversations/:id/messages
export async function sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
  const { data } = await httpClient.post<ApiEnvelope<ChatMessage>>(
    `/conversations/${conversationId}/messages`,
    { content },
  );
  return data.data;
}

// PATCH /conversations/:id/read
export async function markAsRead(conversationId: string): Promise<{ ok: true }> {
  const { data } = await httpClient.patch<ApiEnvelope<{ ok: true }>>(
    `/conversations/${conversationId}/read`,
  );
  return data.data;
}

// GET /establishments/:id — sem guard de ownership no backend (qualquer
// usuário autenticado pode ler nome/avatar de um estabelecimento). Usado só
// como fallback quando o ChatScreen é aberto via push (sem os params de
// navegação que normalmente já carregam esse dado vindos da lista).
export async function getEstablishmentSummary(
  establishmentId: string,
): Promise<ConversationEstablishment> {
  const { data } = await httpClient.get<ApiEnvelope<{ id: string; name: string; avatar: string | null }>>(
    `/establishments/${establishmentId}`,
  );
  return { id: data.data.id, name: data.data.name, avatar: data.data.avatar };
}
