import type { AxiosError } from 'axios';

// Envelope global do backend (WrapperDataInterceptor): recursos únicos vêm
// como { data: T }; listas vêm como { data: T[], meta: {...} }.
export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiErrorBody {
  statusCode: number;
  message:    string | string[];
  error?:     string;
}

export type ApiError = AxiosError<ApiErrorBody>;

export function isApiError(error: unknown): error is ApiError {
  return (error as ApiError)?.isAxiosError === true;
}

export function extractApiMessage(error: unknown): string {
  if (!isApiError(error)) return 'Erro inesperado';
  const msg = error.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? error.message ?? 'Erro inesperado';
}
