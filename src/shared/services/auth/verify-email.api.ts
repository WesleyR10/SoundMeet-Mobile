import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';

/**
 * POST /auth/resend-verification — reenvia o link de confirmação de e-mail.
 *
 * A rota é `@Public()` e responde a MESMA mensagem exista ou não conta para o
 * endereço (senão viraria um verificador de quem tem cadastro). Por isso o
 * retorno é só a mensagem do backend — não há sucesso/falha a distinguir, e a
 * UI não deve inventar um.
 *
 * ⚠️ Throttle de 3/min no backend: a rota dispara e-mail para terceiros. Um
 * botão que permita toque repetido leva a 429.
 */
export async function resendVerificationEmail(email: string): Promise<string> {
  const { data } = await httpClient.post<ApiEnvelope<{ message: string }>>(
    '/auth/resend-verification',
    { email },
  );
  return data.data.message;
}
