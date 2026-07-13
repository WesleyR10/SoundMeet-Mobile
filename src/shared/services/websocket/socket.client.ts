import { io, Socket } from 'socket.io-client';
import { ENV } from '@/shared/services/config/env';
import { getAccessToken } from '@/shared/services/auth/auth.store';

// Singleton de conexão ao NotificationsGateway (/notifications, backend).
// Namespace na origem pura (sem /api/v1 — ver ENV.WS_BASE_URL). Sem mensagem
// de subscribe/join explícita: o servidor já auto-junta o socket na room
// `user:${jwt.sub}` no connect, a partir do próprio token — funciona igual
// pra músico ou audience, cada um só recebe eventos da própria room.
let socket: Socket | null = null;

// `auth` como callback (não objeto estático) — lido a cada tentativa de
// (re)conexão, então sempre pega o token mais recente. Um objeto estático
// capturado na criação do socket ficaria stale depois de um refresh de token
// (o app já tem esse fluxo no interceptor Axios).
export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${ENV.WS_BASE_URL}/notifications`, {
      transports: ['websocket'],
      autoConnect: false,
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
}

export function connectSocket(): void {
  getSocket().connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

// Segundo cliente Socket.io — namespace /chat, uma instância GENUINAMENTE
// separada de getSocket() (io() por namespace sempre cria um objeto novo,
// mesmo reaproveitando o Engine.IO Manager por baixo). Ciclo de vida também
// é diferente de propósito: getSocket() é singleton de sessão
// (connect/disconnect só em useRequestsSocket, ver comentário acima);
// getChatSocket() é screen-scoped — só ChatScreen conecta/entra na
// room/sai/desconecta (useChatSocket.ts, Bloco 9), porque hoje é o único
// consumidor desse namespace (o /chat gateway também não faz auto-join por
// JWT como o /notifications — exige join_conversation explícito). Se um
// segundo consumidor aparecer, vira candidato ao mesmo problema de
// "singleton não reference-counted" que getSocket() já documenta —
// reavaliar nesse momento, não preventivamente agora.
let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!chatSocket) {
    chatSocket = io(`${ENV.WS_BASE_URL}/chat`, {
      transports: ['websocket'],
      autoConnect: false,
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return chatSocket;
}

export function disconnectChatSocket(): void {
  chatSocket?.disconnect();
}
