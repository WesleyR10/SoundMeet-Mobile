import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { SendTipPayload, SendTipResult } from '../domain/tip.types';

// POST /tips (payment-module) — NÃO POST /audiences/:id/tips (audience-module),
// que não retorna qr_code/copy_paste_code. audience_id vem do JWT no backend.
export async function sendTip(payload: SendTipPayload): Promise<SendTipResult> {
  const { data } = await httpClient.post<ApiEnvelope<SendTipResult>>('/tips', payload);
  return data.data;
}
