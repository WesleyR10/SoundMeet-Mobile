import { z } from 'zod';

/**
 * Configuração de ambiente do app.
 *
 * Diferença consciente do `soundmeet-web` (`src/shared/config/env.ts`): lá
 * existe um servidor no meio e o `import "server-only"` protege segredos. Aqui
 * o app roda inteiro no dispositivo, tudo é `EXPO_PUBLIC_*` e não há segredo a
 * esconder — o que precisa ser garantido é outra coisa: que o **canal** por
 * onde a senha e o JWT saem do aparelho seja seguro.
 *
 * Por que isso é um gate de boot e não uma convenção de `.env` (SM-017):
 * `POST /auth/login` é Direct Access Grant, ou seja, manda **senha em claro**
 * para `API_BASE_URL`; e o handshake do Socket.io manda o **access token** para
 * `WS_BASE_URL` (dois namespaces). Um build de loja apontando para `http://`
 * publica as duas coisas em texto puro, e nada no código anterior impedia isso.
 */

export type AppEnv = 'development' | 'preview' | 'production';

/**
 * Hosts que um build `production` pode chamar.
 *
 * Precisa ser constante de código, não variável de ambiente: uma allowlist
 * configurável pelo mesmo canal que ela deveria vigiar não vigia nada. O preço
 * é que mudar de domínio exige mudar esta linha — de propósito, porque essa
 * mudança merece code review.
 *
 * Casa o domínio exato e subdomínios (`api.`, `auth.`). Ainda não há decisão
 * final entre `.app` e `.com.br` (o backend usa `soundmeet.app` como default de
 * `APP_URL` e `api.soundmeet.com.br` em `MAIL_BASE_URL`), então os dois estão
 * aqui. Se o domínio final for outro, o build de produção **falha no boot**
 * apontando para esta constante — que é o modo certo de descobrir.
 */
export const PRODUCTION_HOST_ALLOWLIST = ['soundmeet.app', 'soundmeet.com.br'] as const;

// ── Resolução do ambiente ─────────────────────────────────────────────────────

/**
 * ⚠️ O prefixo `EXPO_PUBLIC_` não é decoração. `babel-preset-expo` só inlina
 * `process.env.EXPO_PUBLIC_*` no bundle (`plugins/inline-env-vars.js`), e o
 * React Native cria `global.process.env` sem **nada** além de `NODE_ENV`
 * (`Libraries/Core/setUpGlobals.js:32`). A variável antiga chamava-se `APP_ENV`,
 * sem prefixo: era `undefined` em runtime, então todo APK/IPA publicado se
 * declarava `development` — o Sentry marcava evento de produção como dev e
 * amostrava 100% das transações — e qualquer regra "só em produção" teria
 * nascido morta. Renomear é o que faz o resto deste arquivo existir de verdade.
 */
const declaredAppEnv = process.env.EXPO_PUBLIC_APP_ENV;

/**
 * `__DEV__` é o piso, e não a variável declarada: em bundle de release ele é
 * `false` de forma confiável (o Metro define), enquanto a variável depende de
 * alguém ter lembrado de configurá-la no perfil do EAS. Esquecer não pode ser
 * um jeito de afrouxar a regra, então ausência ou incoerência resolve para o
 * ambiente **mais restrito** compatível com o bundle.
 */
export function resolveAppEnv(
  declared: string | undefined,
  isReleaseBundle: boolean,
): AppEnv {
  if (declared === 'preview' || declared === 'production') return declared;
  if (declared === 'development' && !isReleaseBundle) return 'development';
  return isReleaseBundle ? 'production' : 'development';
}

// ── Validação de canal ────────────────────────────────────────────────────────

/**
 * Parser mínimo de origem — de propósito **não** usa `new URL()`. O polyfill de
 * URL do React Native não é o do navegador e já teve `protocol`/`hostname`
 * incompletos; aqui a regra de segurança dependeria justamente desses dois
 * campos. Regex mantém o comportamento idêntico entre o jest (Node) e o
 * aparelho, que é o que torna o teste desta regra confiável.
 */
export function parseEndpoint(value: string): { scheme: string; host: string } | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)/i.exec(value.trim());
  if (!match) return null;

  const authority = match[2];
  // Descarta `user:senha@` antes de olhar o host — senão `evil.com` em
  // `https://soundmeet.app@evil.com` passaria pela allowlist.
  const hostPort = authority.slice(authority.lastIndexOf('@') + 1);

  const host = hostPort.startsWith('[')
    ? hostPort.slice(0, hostPort.indexOf(']') + 1) // literal IPv6
    : hostPort.split(':')[0];

  if (!host) return null;
  return { scheme: match[1].toLowerCase(), host: host.toLowerCase() };
}

/**
 * `endsWith('.' + domain)`, nunca `endsWith(domain)` puro: o segundo aceitaria
 * `evilsoundmeet.app` como se fosse nosso.
 */
export function isHostAllowed(host: string, allowlist: readonly string[]): boolean {
  return allowlist.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

const SECURE_SCHEMES: Record<'http' | 'ws', readonly string[]> = {
  http: ['https'],
  // Socket.io com `transports: ['websocket']` sobe para wss sozinho a partir de
  // uma origem https — as duas grafias descrevem o mesmo canal cifrado.
  ws: ['https', 'wss'],
};

/**
 * Devolve a descrição do problema, ou `null` se o endpoint está aceitável.
 * Função pura para ser testável sem mexer em `process.env` — o valor real é
 * inlinado no bundle e não dá para reatribuir em teste.
 */
export function describeEndpointProblem(params: {
  label: string;
  value: string;
  kind: 'http' | 'ws';
  requireSecure: boolean;
  allowlist: readonly string[] | null;
}): string | null {
  const { label, value, kind, requireSecure, allowlist } = params;

  if (!value) return `${label}: ausente.`;

  const parsed = parseEndpoint(value);
  if (!parsed) return `${label}: "${value}" não é uma URL absoluta (falta o esquema).`;

  if (requireSecure && !SECURE_SCHEMES[kind].includes(parsed.scheme)) {
    return (
      `${label}: esquema "${parsed.scheme}" não é aceito fora de development ` +
      `(esperado ${SECURE_SCHEMES[kind].join(' ou ')}). ` +
      `Senha e JWT sairiam do aparelho em texto puro.`
    );
  }

  if (allowlist && !isHostAllowed(parsed.host, allowlist)) {
    return (
      `${label}: host "${parsed.host}" fora da allowlist de produção ` +
      `(${allowlist.join(', ')}). Ajuste PRODUCTION_HOST_ALLOWLIST em ` +
      `shared/services/config/env.ts se o domínio mudou.`
    );
  }

  return null;
}

// ── Carga ─────────────────────────────────────────────────────────────────────

// Socket.io conecta na origem pura (sem /api/v1) — o NotificationsGateway expõe
// o namespace /notifications direto na raiz do host, fora do prefixo REST.
const stripApiSuffix = (url: string) => url.replace(/\/api\/v1\/?$/, '');

// Referências ESTÁTICAS a `process.env.EXPO_PUBLIC_*`: é o formato que o babel
// reconhece para inlinar. Acesso dinâmico (`process.env[chave]`) devolveria
// `undefined` no aparelho, com tudo compilando normalmente.
const rawEnv = {
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_WS_BASE_URL: process.env.EXPO_PUBLIC_WS_BASE_URL,
  EXPO_PUBLIC_KEYCLOAK_URL: process.env.EXPO_PUBLIC_KEYCLOAK_URL,
  EXPO_PUBLIC_KEYCLOAK_REALM: process.env.EXPO_PUBLIC_KEYCLOAK_REALM,
  EXPO_PUBLIC_KEYCLOAK_CLIENT_ID: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
};

const appEnv = resolveAppEnv(declaredAppEnv, !__DEV__);
const isDev = appEnv === 'development';

// Defaults só existem em development — o ambiente onde apontar para o localhost
// é o fluxo diário. Fora dele, ausência é erro: um default silencioso em build
// de loja é como o app antigo caía para `http://localhost:3000` sem avisar.
const devDefaults = {
  EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/api/v1',
  EXPO_PUBLIC_KEYCLOAK_URL: 'http://localhost:8080',
  EXPO_PUBLIC_KEYCLOAK_REALM: 'soundmeet',
  EXPO_PUBLIC_KEYCLOAK_CLIENT_ID: 'soundmeet-mobile',
} as const;

const envSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.string().min(1),
  // Vazio é válido e significa "derive de API_BASE_URL" — só precisa ser
  // definida quando o host do WebSocket difere do host da API.
  EXPO_PUBLIC_WS_BASE_URL: z.string().default(''),
  EXPO_PUBLIC_KEYCLOAK_URL: z.string().min(1),
  EXPO_PUBLIC_KEYCLOAK_REALM: z.string().min(1),
  EXPO_PUBLIC_KEYCLOAK_CLIENT_ID: z.string().min(1),
  // DSN vazio = Sentry.init roda inerte (não envia nada) — nunca bloqueia o
  // boot, mesmo sem projeto Sentry configurado.
  EXPO_PUBLIC_SENTRY_DSN: z.string().default(''),
});

function loadEnv() {
  const source = isDev ? { ...devDefaults, ...stripUndefined(rawEnv) } : stripUndefined(rawEnv);
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(
      formatBootFailure(
        appEnv,
        parsed.error.issues.map(
          (issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`,
        ),
      ),
    );
  }

  const apiBaseUrl = parsed.data.EXPO_PUBLIC_API_BASE_URL;
  const wsBaseUrl = parsed.data.EXPO_PUBLIC_WS_BASE_URL || stripApiSuffix(apiBaseUrl);

  const requireSecure = !isDev;
  const allowlist = appEnv === 'production' ? PRODUCTION_HOST_ALLOWLIST : null;

  const problems = [
    describeEndpointProblem({
      label: 'EXPO_PUBLIC_API_BASE_URL',
      value: apiBaseUrl,
      kind: 'http',
      requireSecure,
      allowlist,
    }),
    describeEndpointProblem({
      label: 'EXPO_PUBLIC_WS_BASE_URL',
      value: wsBaseUrl,
      kind: 'ws',
      requireSecure,
      allowlist,
    }),
    describeEndpointProblem({
      label: 'EXPO_PUBLIC_KEYCLOAK_URL',
      value: parsed.data.EXPO_PUBLIC_KEYCLOAK_URL,
      kind: 'http',
      requireSecure,
      allowlist,
    }),
  ].filter((problem): problem is string => problem !== null);

  if (problems.length > 0) {
    throw new Error(formatBootFailure(appEnv, problems));
  }

  return { ...parsed.data, apiBaseUrl, wsBaseUrl };
}

function stripUndefined(record: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function formatBootFailure(env: AppEnv, problems: string[]): string {
  return (
    `Configuração de ambiente inválida (EXPO_PUBLIC_APP_ENV=${env}):\n` +
    problems.map((problem) => `  - ${problem}`).join('\n') +
    `\n\nCopie .env.example para .env e preencha. Em build do EAS, as variáveis ` +
    `vêm de eas.json (perfil) ou dos secrets do projeto.`
  );
}

const raw = loadEnv();

export const ENV = {
  APP_ENV: appEnv,
  IS_DEV: isDev,

  API_BASE_URL: raw.apiBaseUrl,
  WS_BASE_URL: raw.wsBaseUrl,

  KEYCLOAK: {
    URL: raw.EXPO_PUBLIC_KEYCLOAK_URL,
    REALM: raw.EXPO_PUBLIC_KEYCLOAK_REALM,
    CLIENT_ID: raw.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID,
    // `REDIRECT_URI` saiu daqui em SM-017: era constante morta. Quem define o
    // callback de verdade é `makeRedirectUri()` em keycloak.service.ts, e ter
    // duas fontes para o mesmo valor é convite a divergirem.
  },

  SENTRY_DSN: raw.EXPO_PUBLIC_SENTRY_DSN,
} as const;
