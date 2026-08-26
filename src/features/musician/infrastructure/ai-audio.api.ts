import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type {
  PracticeSeparationJob,
  RequestPracticeSeparationPayload,
} from '../domain/practice.types';

// 1 arquivo = 1 recurso backend (regra FSD do projeto). Aqui: ai-audio, a
// separação de stems que alimenta o Modo Ensaio.
//
// ⚠️ Toda resposta vem embrulhada pelo WrapperDataInterceptor global —
// retornar `data` cru daria campos undefined em silêncio.

/**
 * Modo Ensaio: separa os stems de uma música da biblioteca.
 *
 * O app NÃO envia arquivo: o backend re-resolve o áudio pelo provider, porque
 * o original foi descartado assim que a análise da cifra terminou. Mesmo
 * desenho de `requestCifraAnalysisFromProvider`.
 */
export async function requestPracticeSeparation(
  musicianId: string,
  payload: RequestPracticeSeparationPayload,
): Promise<PracticeSeparationJob> {
  const { data } = await httpClient.post<ApiEnvelope<PracticeSeparationJob>>(
    `/musicians/${musicianId}/ai-audio/practice/separations`,
    payload,
  );
  return data.data;
}

export async function getPracticeSeparation(
  jobId: string,
): Promise<PracticeSeparationJob> {
  const { data } = await httpClient.get<ApiEnvelope<PracticeSeparationJob>>(
    `/ai-audio/separations/${jobId}`,
  );
  return data.data;
}
