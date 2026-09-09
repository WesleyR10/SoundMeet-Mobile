import { httpClient } from '@/shared/services/http/client';

/**
 * O que foi compartilhado. Espelha `SOCIAL_SHARE_CONTENT_TYPES` do backend —
 * um valor fora da lista devolve 422.
 */
export type SocialShareContentType = 'tip_receipt' | 'show_recap' | 'qr_code' | 'request';

export type SocialSharePlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'whatsapp'
  | 'telegram';

/**
 * POST /audiences/:id/social-shares — registra o compartilhamento e credita
 * pontos ao fã.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 🔴 O QUE ESTA CHAMADA NÃO AFIRMA
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Ela **não** afirma que o conteúdo foi publicado. `imageShare.ts` documenta
 * que o SO não distingue "compartilhou" de "abriu o menu e cancelou" — a
 * Promise resolve igual nos dois casos. Por isso:
 *
 *  - o valor é baixo (10 pontos, ordem de um scan de QR), e não os 50 de antes;
 *  - o crédito é único POR CONTEÚDO, deduplicado no backend pelo par
 *    (content_type, content_id) contra o ledger `UserScore`.
 *
 * Os 50 pontos ficam reservados à missão 7.11, que exige prova do post.
 *
 * ⚠️ **Chamar de novo é seguro e esperado.** Compartilhar o mesmo recibo com
 * outro grupo é uso normal; o backend simplesmente não paga duas vezes.
 *
 * ⚠️ Só o PÚBLICO tem pontuação: a rota é escopada em `/audiences`. Cards do
 * músico (recap de show, QR) não têm o que creditar — não é esquecimento.
 */
export async function registerSocialShare(params: {
  audienceId:  string;
  contentType: SocialShareContentType;
  contentId:   string;
  /**
   * Só quando o destino é REALMENTE conhecido (um botão dedicado a uma rede).
   * A partir do share sheet genérico do SO, deixe ausente — inventar o destino
   * grava dado falso.
   */
  platform?:   SocialSharePlatform;
}): Promise<void> {
  await httpClient.post(`/audiences/${params.audienceId}/social-shares`, {
    content_type: params.contentType,
    content_id:   params.contentId,
    ...(params.platform ? { platform: params.platform } : {}),
  });
}
