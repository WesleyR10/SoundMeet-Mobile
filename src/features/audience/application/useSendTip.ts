import { useMutation } from '@tanstack/react-query';
import { sendTip } from '../infrastructure/tip.api';
import type { SendTipPayload } from '../domain/tip.types';

// POST /tips direto (payment-module) — não o wrapper de audiences-module,
// que não retorna qr_code/copy_paste_code. Gateway mock (PixGatewayMock,
// ver soundmeet-backend/Docs/roadmap.md Bloco 1.6) — tratar como não-produção.
export function useSendTip() {
  return useMutation({
    mutationFn: (payload: SendTipPayload) => sendTip(payload),
  });
}
