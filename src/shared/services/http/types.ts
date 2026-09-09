import type { AxiosError } from 'axios';

// Envelope global do backend (WrapperDataInterceptor): recursos únicos vêm
// como { data: T }; listas vêm como { data: T[], meta: {...} }.
export interface ApiEnvelope<T> {
  data: T;
}

// Erro de validação de domínio (EntityValidationError do core) — formato
// [{ campo: [mensagens] }], diferente do ValidationPipe do Nest (que manda
// message: string[] plano). Ex.: aceitar/recusar convite de banda já
// respondido usa esse formato.
type DomainFieldError = Record<string, string[]>;

export interface ApiErrorBody {
  statusCode: number;
  message:    string | string[] | DomainFieldError[];
  error?:     string;
  // Discriminador opcional para recusas que o cliente precisa tratar de forma
  // específica. Hoje só `EMAIL_NOT_VERIFIED` o preenche — o corpo padrão
  // (statusCode/error/message) não distinguiria esse 403 de qualquer outro.
  code?:      string;
}

export type ApiError = AxiosError<ApiErrorBody>;

export function isApiError(error: unknown): error is ApiError {
  return (error as ApiError)?.isAxiosError === true;
}

function isDomainFieldErrorArray(msg: unknown): msg is DomainFieldError[] {
  return Array.isArray(msg) && msg.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item));
}

// `PlanLimitExceededError` do core vira 402 no GlobalExceptionFilter — é o
// único status que significa "o plano não cobre isso", nunca falha técnica.
// Telas que podem receber 402 devem oferecer upgrade em vez de "tentar
// novamente", que nunca vai funcionar. Ex.: AnalyticsScreen para músico FREE
// desde o gate 9.7a.
export function isPlanLimitError(error: unknown): boolean {
  return isApiError(error) && error.response?.status === 402;
}

// `EmailNotVerifiedError` do core vira 403 com `code: "EMAIL_NOT_VERIFIED"`.
//
// 🔴 O `code` é checado, não só o status: 403 sozinho é "proibido" genérico e
// pode vir de um guard de ownership. Quem confunde os dois oferece "reenviar
// e-mail" para quem tentou mexer no recurso de outra pessoa — e, pior, deixa
// de oferecer quando o motivo é mesmo o e-mail.
//
// Telas que movem dinheiro (saque PIX) devem oferecer REENVIAR o e-mail em vez
// de "tentar novamente", que nunca vai funcionar sozinho.
export function isEmailNotVerifiedError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  const response = error.response;
  return response?.status === 403 && response?.data?.code === 'EMAIL_NOT_VERIFIED';
}

export function extractApiMessage(error: unknown): string {
  if (!isApiError(error)) return 'Erro inesperado';
  const msg = error.response?.data?.message;
  if (isDomainFieldErrorArray(msg)) {
    return msg.flatMap((item) => Object.values(item).flat()).join(', ') || 'Erro inesperado';
  }
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? error.message ?? 'Erro inesperado';
}
