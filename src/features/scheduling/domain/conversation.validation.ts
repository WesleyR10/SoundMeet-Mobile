import { z } from 'zod';

// Espelha SendMessageDto do backend (chat-module/dto): content string,
// 1-2000 caracteres.
export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Escreva uma mensagem').max(2000, 'Mensagem muito longa (máx. 2000 caracteres)'),
});

export type SendMessageFormValues = z.infer<typeof sendMessageSchema>;
