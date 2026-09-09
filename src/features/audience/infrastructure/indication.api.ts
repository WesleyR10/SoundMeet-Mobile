import { httpClient } from '@/shared/services/http/client';

/**
 * POST /audiences/:id/indications — o fã indica um músico para um
 * estabelecimento.
 *
 * ⚠️ **Uma indicação por (fã, músico, estabelecimento).** Repetir não cria uma
 * segunda: o backend é idempotente por esse trio, porque a mesma pessoa
 * indicando o mesmo artista para a mesma casa de novo é a mesma opinião,
 * repetida. Os pontos também só são creditados uma vez.
 *
 * A indicação vai para a caixa de entrada do estabelecimento (web) — é a
 * metade B2B do ciclo, que até 28/set/2026 não existia porque o dado era
 * descartado.
 */
export async function indicateMusician(params: {
  audienceId:       string;
  musicianId:       string;
  establishmentId:  string;
  message?:         string;
}): Promise<void> {
  await httpClient.post(`/audiences/${params.audienceId}/indications`, {
    musician_id:      params.musicianId,
    establishment_id: params.establishmentId,
    ...(params.message?.trim() ? { message: params.message.trim() } : {}),
  });
}
