import type { AxiosError } from 'axios';

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
