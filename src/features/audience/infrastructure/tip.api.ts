import { httpClient } from '@/shared/services/http/client';
import type { ApiEnvelope } from '@/shared/services/http/types';
import type { SendTipPayload, SendTipResult, TipDetail } from '../domain/tip.types';

// POST /tips (payment-module) — NÃO POST /audiences/:id/tips (audience-module),
// que não retorna qr_code/copy_paste_code. audience_id vem do JWT no backend.
export async function sendTip(payload: SendTipPayload): Promise<SendTipResult> {
  const { data } = await httpClient.post<ApiEnvelope<SendTipResult>>('/tips', payload);
  return data.data;
}

// GET /tips/:id — o fã relê a própria gorjeta.
//
// O PIX é assíncrono: sem isto o app mostra o QR e nunca fica sabendo que o
// pagamento entrou. O socket cobre quem está com o app aberto; esta rota cobre
// quem voltou depois — é o que permite a celebração acontecer no cold start.
export async function getTip(tipId: string): Promise<TipDetail> {
  const { data } = await httpClient.get<ApiEnvelope<TipDetail>>(`/tips/${tipId}`);
  return data.data;
}
