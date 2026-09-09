/**
 * Leitura do conteúdo do QR code do SoundMeet.
 *
 * ## Dois formatos, e por quê
 *
 * - `https://soundmeet.com.br/musico/<uuid>` — o formato atual. É o que faz o
 *   adesivo de mesa funcionar na câmera nativa de quem ainda **não tem o app**:
 *   sem o app, abre a página pública; com o app e os App Links verificados, o
 *   SO abre o app direto.
 * - `soundmeet://musician/<uuid>` — legado. Continua aceito porque QR já
 *   impresso não se atualiza.
 *
 * ## 🔴 A allowlist de host não é detalhe
 *
 * `https://evil.example/musico/<uuid>` casa no padrão de caminho. Sem comparar
 * o host, um adesivo colado por cima do original levaria o fã a um domínio de
 * terceiro que o app trataria como nosso.
 *
 * ⚠️ **Parse manual, não `new URL()`** — mesma decisão de
 * `shared/utils/external-url.ts`: o `URL` do React Native
 * (`Libraries/Blob/URL.js`) é uma imitação por regex que diverge da WHATWG, e
 * o Jest roda em Node, onde `URL` é o de verdade. Um validador escrito sobre
 * `URL` passaria em todos os testes e falharia no aparelho.
 */
/**
 * 🔴 Só o domínio que a plataforma REGISTROU (Hostinger, 29/ago/2026).
 *
 * `soundmeet.app` esteve nesta lista até 07/set/2026 e é de TERCEIRO — com ele
 * aqui, um adesivo impresso apontando para aquele domínio era aceito como
 * nosso, que é precisamente o ataque descrito acima. Nenhum QR de produção
 * saiu com ele: o rebuild nativo que ligaria os App Links nunca aconteceu.
 */
const ALLOWED_HOSTS = ['soundmeet.com.br'] as const;

export type QrTarget =
  | { kind: 'musician'; id: string }
  | { kind: 'establishment'; id: string };

const LEGACY_PATTERN = /^soundmeet:\/\/(musician|establishment)\/([^/?#]+)$/;

// Aceita só https e captura host + caminho. Sem `.*` no host: a captura para
// no primeiro `/`, então userinfo (`https://evil.example@soundmeet.com.br/`) não
// vira host — o `@` cairia dentro do grupo e a comparação de igualdade falha.
const LINK_PATTERN = /^https:\/\/([^/?#]+)\/(musico|local)\/([^/?#]+)$/;

export function parseQrTarget(raw: string): QrTarget | null {
  const value = raw.trim();

  const legacy = LEGACY_PATTERN.exec(value);
  if (legacy) {
    return {
      kind: legacy[1] === 'musician' ? 'musician' : 'establishment',
      id: legacy[2],
    };
  }

  const link = LINK_PATTERN.exec(value);
  if (!link) return null;

  const [, host, segment, id] = link;

  // Igualdade exata. `endsWith` aceitaria `notsoundmeet.com.br`; `includes`
  // aceitaria `soundmeet.com.br.evil.com`.
  if (!ALLOWED_HOSTS.includes(host.toLowerCase() as (typeof ALLOWED_HOSTS)[number])) {
    return null;
  }

  return { kind: segment === 'musico' ? 'musician' : 'establishment', id };
}
