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

export function extractApiMessage(error: unknown): string {
  if (!isApiError(error)) return 'Erro inesperado';
  const msg = error.response?.data?.message;
  if (isDomainFieldErrorArray(msg)) {
    return msg.flatMap((item) => Object.values(item).flat()).join(', ') || 'Erro inesperado';
  }
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? error.message ?? 'Erro inesperado';
}
