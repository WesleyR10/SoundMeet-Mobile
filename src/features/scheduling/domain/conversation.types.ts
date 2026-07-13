// Espelha Conversation.toJSON()/Message.toJSON() do backend (core/chat),
// já com o enriquecimento feito em ChatController.listConversations()
// (establishment/last_message/unread_count — ver Bloco 9 do roadmap-mobile).
// Domínio puro, sem imports de RN/Expo.

export type SenderType = 'musician' | 'establishment' | 'band';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ConversationEstablishment {
  id:     string;
  name:   string;
  avatar: string | null;
}

export interface ConversationLastMessage {
  content:    string;
  sender_id:  string;
  status:     MessageStatus;
  created_at: string;
}

// Base = Conversation.toJSON() cru do backend (mesmo shape que
// GetConversationUseCase retorna dentro de ConversationMessagesPage,
// abaixo). Conversation (com enriquecimento) e ConversationMessagesPage's
// campo `conversation` COMPARTILHAM essa base, em vez de um derivar o outro
// via Omit — são dois payloads de endpoints diferentes que só coincidem em
// parte, não uma relação "um é o outro menos alguns campos" (achado em
// revisão: o Omit anterior acoplava ConversationMessagesPage a detalhes de
// enriquecimento do ChatController que não têm nada a ver com
// GET /conversations/:id/messages).
export interface ConversationSummary {
  conversation_id: string;
  inquiry_id:      string;
  establishment_id: string;
  musician_id:      string | null;
  band_id:          string | null;
  created_at:       string;
  updated_at:       string;
}

// Item de GET /conversations — ConversationSummary + enriquecimento do
// controller (establishment/last_message/unread_count).
export interface Conversation extends ConversationSummary {
  establishment: ConversationEstablishment | null;
  last_message:  ConversationLastMessage | null;
  unread_count:  number;
}

// Message.toJSON() — mensagem individual dentro de uma conversa.
export interface ChatMessage {
  message_id:      string;
  conversation_id: string;
  sender_id:       string;
  sender_type:     SenderType;
  content:         string;
  status:          MessageStatus;
  created_at:      string;
  read_at:         string | null;
}

// GET /conversations/:id/messages — GetConversationOutput
export interface ConversationMessagesPage {
  conversation: ConversationSummary;
  messages:     ChatMessage[];
  next_cursor:  string | null;
}
