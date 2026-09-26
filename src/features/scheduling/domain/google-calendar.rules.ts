// Regras puras do retorno do consentimento do Google Agenda (24/set/2026).
// Domínio puro — sem RN/Expo/Axios.
import { GOOGLE_CALENDAR_RETURN_URL } from './google-calendar.types';

/**
 * O que aconteceu na volta da Chrome Custom Tab.
 *
 * - `connected` — o backend trocou o code e gravou a integração;
 * - `cancelled` — o músico negou o consentimento na tela do Google;
 * - `failed` — o callback rejeitou (state inválido/expirado, code ausente,
 *   falha na troca com o Google);
 * - `unknown` — a aba fechou sem passar pelo callback.
 *
 * 🔴 **`unknown` não é sinônimo de fracasso, e por isso tem nome próprio.**
 * `openAuthSessionAsync` devolve `dismiss` quando o usuário fecha a aba na mão
 * — o que normalmente quer dizer que ele desistiu, mas também cobre o caso de
 * o app ter sido trazido de volta por outro caminho. Afirmar "não deu certo"
 * aí seria inventar um fato: quem sabe é o servidor, e é ele que respondemos
 * relendo o `status`.
 */
export type GoogleCalendarConnectOutcome =
  | 'connected'
  | 'cancelled'
  | 'failed'
  | 'unknown';

/*
 * ⚠️ Parse manual, nunca `new URL()` — mesma decisão de `shared/utils/qr-link.ts`
 * e `external-url.ts`: o `URL` do React Native é uma imitação por regex que
 * diverge da WHATWG, e o Jest roda em Node, onde `URL` é o de verdade. Um
 * parser escrito sobre ele passaria em todo teste e erraria no aparelho.
 *
 * O prefixo é comparado inteiro: `openAuthSessionAsync` só devolve URL que casa
 * com o `returnUrl`, mas a defesa não pode depender de garantia de terceiro.
 */
const RETURN_PATTERN = new RegExp(
  `^${GOOGLE_CALENDAR_RETURN_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?status=([a-z]+)$`,
);

const OUTCOME_BY_STATUS: Record<string, GoogleCalendarConnectOutcome> = {
  sucesso:   'connected',
  cancelado: 'cancelled',
  erro:      'failed',
};

/**
 * Lê o `?status=` do deep link de retorno.
 *
 * Status desconhecido (backend mais novo que o app) vira `unknown`, nunca
 * `failed` — um nome que o app não conhece não é prova de que algo quebrou.
 */
export function parseGoogleCalendarReturn(
  url: string | null | undefined,
): GoogleCalendarConnectOutcome {
  if (!url) return 'unknown';
  const match = RETURN_PATTERN.exec(url);
  if (!match) return 'unknown';
  return OUTCOME_BY_STATUS[match[1]] ?? 'unknown';
}

/** Mensagem para o músico. `connected` e `unknown` não têm o que dizer — a
 *  própria mudança do card já conta a história. */
export function connectOutcomeMessage(
  outcome: GoogleCalendarConnectOutcome,
): string | null {
  switch (outcome) {
    case 'cancelled':
      return 'Você não autorizou o acesso. Sua agenda continua só aqui.';
    case 'failed':
      return 'Não deu para conectar agora. Tente de novo em instantes.';
    default:
      return null;
  }
}
