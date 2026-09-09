/**
 * SM-025 — allowlist de links externos.
 *
 * Nenhuma URL vinda de perfil chega ao sistema operacional sem passar por aqui.
 * O caminho antigo era `Linking.openURL` direto sobre o texto que o músico
 * digitou, com um único teste de `/^https?:\/\//`. Esse teste aceita `http://`
 * (downgrade de transporte) e — o caso que importa — aceita
 * `https://instagram.com@evil.example/`: o badge diz "IG", o texto na tela
 * começa com `instagram.com`, e quem abre é `evil.example`, porque tudo antes
 * do `@` é userinfo, não host.
 *
 * ⚠️ **NÃO usar `new URL()` aqui.** O `URL` do React Native
 * (`Libraries/Blob/URL.js`) é uma imitação por regex: não lança em entrada
 * inválida, não normaliza `\` e extrai `hostname` com uma regex que diverge da
 * WHATWG — para `https://evil.example\@instagram.com` ele devolve
 * `instagram.com`, enquanto o navegador (que é quem de fato abre o link) vai
 * para `evil.example`. O Jest roda em Node, onde `URL` é o de verdade: um
 * validador escrito sobre `URL` passaria em todos os testes e falharia no
 * aparelho. Por isso o parser abaixo é próprio, e **recusa** em vez de tentar
 * reproduzir a normalização do navegador de cabeça.
 */

export type SocialPlatform = 'instagram' | 'youtube' | 'spotify';

export type ExternalUrlBlockReason =
  | 'empty'
  | 'unsafe_characters'
  | 'not_https'
  | 'has_userinfo'
  | 'invalid_host';

export type ExternalUrlVerdict =
  /** Host dentro da allowlist do contexto — abre direto. */
  | { status: 'trusted';    url: string; host: string }
  /** URL bem formada, host desconhecido — abre só com confirmação nomeando o host. */
  | { status: 'unverified'; url: string; host: string }
  /** Não abre de jeito nenhum. */
  | { status: 'blocked';    reason: ExternalUrlBlockReason };

/*
 * Controle, espaço e barra invertida. A WHATWG manda REMOVER tab/CR/LF antes de
 * parsear (um TAB no meio de `ht[TAB]tps://…` some e o resultado é `https://…`)
 * e tratar `\` como `/`. Reproduzir essa limpeza aqui seria copiar o navegador
 * de memória e errar em algum canto; recusar é a única resposta que não depende
 * de acertar a cópia.
 */
function hasUnsafeCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    // Controle C0 (0x00-0x1F), espaço (0x20) e DEL (0x7F).
    if (code <= 0x20 || code === 0x7f) return true;
    // Barra invertida: esquema especial da WHATWG a trata como `/`.
    if (value[i] === String.fromCharCode(0x5c)) return true;
  }
  return false;
}

/*
 * Host ASCII com pelo menos um ponto. Sem `%` porque a WHATWG percent-decodifica
 * o host (`%69nstagram.com` vira `instagram.com`) e sem não-ASCII porque o
 * homógrafo cirílico de `instagram.com` é indistinguível na tela.
 */
const HOSTNAME =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const SCHEME_AUTHORITY = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\/([^/?#]*)([/?#][\s\S]*)?$/;

const HAS_SCHEME = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

type ParsedUrl = {
  scheme:   string;
  userinfo: string | null;
  host:     string;
  port:     string | null;
};

function parseAbsoluteUrl(raw: string): ParsedUrl | null {
  const match = SCHEME_AUTHORITY.exec(raw);
  if (!match) return null;

  const authority = match[2];

  // `lastIndexOf` e não `indexOf`: o host é o que vem depois do ÚLTIMO `@` —
  // `https://a@instagram.com@evil.example/` aponta para `evil.example`.
  const at       = authority.lastIndexOf('@');
  const hostPort = at >= 0 ? authority.slice(at + 1) : authority;

  // IPv6 (`[::1]`) não aparece em link de perfil, e parsear pela metade é pior
  // do que recusar.
  if (hostPort.startsWith('[')) return null;

  const colon = hostPort.indexOf(':');

  return {
    scheme:   match[1].toLowerCase(),
    userinfo: at >= 0 ? authority.slice(0, at) : null,
    host:     (colon >= 0 ? hostPort.slice(0, colon) : hostPort).toLowerCase(),
    port:     colon >= 0 ? hostPort.slice(colon + 1) : null,
  };
}

/**
 * `endsWith('.' + domain)` e não `endsWith(domain)`: sem o ponto,
 * `notinstagram.com` passaria por `instagram.com` — que é exatamente o
 * "domínio parecido" que a allowlist existe para negar.
 */
export function isWithinDomain(host: string, domain: string): boolean {
  const registrable = domain.toLowerCase();
  return host === registrable || host.endsWith(`.${registrable}`);
}

/**
 * Decide o que fazer com uma URL de origem não confiável.
 *
 * `allowedDomains` vazio nunca devolve `trusted` — a URL válida vira
 * `unverified` e o usuário confirma o destino antes de sair do app.
 */
export function resolveExternalUrl(
  raw: string | null | undefined,
  allowedDomains: readonly string[] = [],
): ExternalUrlVerdict {
  const value = (raw ?? '').trim();

  if (!value)                        return { status: 'blocked', reason: 'empty' };
  if (hasUnsafeCharacters(value))    return { status: 'blocked', reason: 'unsafe_characters' };

  const parsed = parseAbsoluteUrl(value);

  // Sem `esquema://` não é link absoluto; com esquema diferente de https, é
  // `javascript:`, `intent:`, `file:`, `data:` ou o downgrade `http:`.
  if (!parsed || parsed.scheme !== 'https') return { status: 'blocked', reason: 'not_https' };
  if (parsed.userinfo !== null)             return { status: 'blocked', reason: 'has_userinfo' };
  if (!HOSTNAME.test(parsed.host))          return { status: 'blocked', reason: 'invalid_host' };
  if (parsed.port !== null && !/^\d+$/.test(parsed.port)) {
    return { status: 'blocked', reason: 'invalid_host' };
  }

  const trusted = allowedDomains.some((domain) => isWithinDomain(parsed.host, domain));

  return { status: trusted ? 'trusted' : 'unverified', url: value, host: parsed.host };
}

export const SOCIAL_DOMAINS: Record<SocialPlatform, readonly string[]> = {
  instagram: ['instagram.com'],
  // `youtu.be` é domínio registrável próprio, não subdomínio de youtube.com.
  youtube:   ['youtube.com', 'youtu.be'],
  spotify:   ['spotify.com'],
};

const SOCIAL_HANDLE_URL: Record<SocialPlatform, (handle: string) => string> = {
  instagram: (handle) => `https://instagram.com/${handle}`,
  // O YouTube quer o `@` no caminho; o Instagram não. O código antigo tratava
  // os dois igual (`https://${value}`) e transformava `@canal` em
  // `https://@canal` — host vazio com userinfo, que é o formato que esta
  // allowlist recusa.
  youtube:   (handle) => `https://youtube.com/@${handle}`,
  spotify:   (handle) => `https://open.spotify.com/${handle}`,
};

/**
 * Monta e classifica o link de uma rede conhecida a partir do que o músico
 * digitou — que pode ser `@handle`, `instagram.com/joao` ou a URL inteira.
 *
 * Valor sem esquema que NÃO seja um host da própria rede é tratado como
 * handle: `evil.example/x` no campo do Instagram vira
 * `https://instagram.com/evil.example/x`, um link morto dentro do Instagram, e
 * não uma visita a `evil.example`. O badge "IG" só abre o Instagram.
 */
export function buildSocialUrl(
  platform: SocialPlatform,
  rawValue: string | null | undefined,
): ExternalUrlVerdict {
  const value = (rawValue ?? '').trim();

  if (!value)                        return { status: 'blocked', reason: 'empty' };
  if (hasUnsafeCharacters(value))    return { status: 'blocked', reason: 'unsafe_characters' };

  const domains = SOCIAL_DOMAINS[platform];

  if (HAS_SCHEME.test(value)) {
    // Já traz esquema: vale o que ele diz. Nunca prefixar `https://` sobre um
    // esquema existente — `https://javascript:alert(1)` esconderia a recusa.
    return resolveExternalUrl(value, domains);
  }

  const authority   = value.split(/[/?#]/, 1)[0].toLowerCase();
  const isKnownHost = domains.some((domain) => isWithinDomain(authority, domain));

  const candidate = isKnownHost
    ? `https://${value}`
    : SOCIAL_HANDLE_URL[platform](value.replace(/^@+/, ''));

  return resolveExternalUrl(candidate, domains);
}
