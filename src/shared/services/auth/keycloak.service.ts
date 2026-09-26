import * as WebBrowser from 'expo-web-browser';
import {
  AuthRequest,
  exchangeCodeAsync,
  makeRedirectUri,
  refreshAsync,
  revokeAsync,
  TokenResponse,
  TokenTypeHint,
} from 'expo-auth-session';
import { ENV } from '@/shared/services/config/env';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { AuthUser } from '@/shared/services/auth/auth.store';
import { usePendingGoogleSessionStore } from '@/shared/services/auth/pendingGoogleSession.store';
import { clearLocalSession } from '@/shared/services/auth/clear-session';
import { resolveSessionChannel } from '@/shared/services/auth/session-channel';
import {
  requestPasswordLogin,
  requestSessionRefresh,
  requestSessionRevocation,
  type PasswordSessionTokens,
} from '@/shared/services/auth/password-session.api';
import {
  saveTokens,
  getTokens,
  isTokenExpired,
  type StoredTokens,
} from '@/shared/services/storage/token.storage';

// Required on web to close the auth popup; no-op on native iOS/Android
WebBrowser.maybeCompleteAuthSession();

// ── Discovery ──────────────────────────────────────────────────────────────────

const { URL: KEYCLOAK_URL, REALM, CLIENT_ID } = ENV.KEYCLOAK;

const discovery = {
  authorizationEndpoint: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`,
  tokenEndpoint:         `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
  revocationEndpoint:    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/revoke`,
  endSessionEndpoint:    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`,
} as const;

const SCOPES = ['openid', 'profile', 'email', 'offline_access'];

// ── JWT utilities ──────────────────────────────────────────────────────────────

interface JwtPayload {
  sub:              string;
  azp?:             string;
  email?:           string;
  realm_access?:    { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] } | undefined>;
  establishment_ids?: string[];
  band_ids?:          string[];
  exp:              number;
}

function decodeJwt(token: string): JwtPayload {
  const raw = token.split('.')[1];
  if (!raw) throw new Error('Malformed JWT');

  // base64url → base64 → UTF-8 safe decode (handles non-ASCII characters in claims)
  const base64  = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padded  = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const decoded = decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );

  return JSON.parse(decoded) as JwtPayload;
}

export function buildAuthUser(accessToken: string): AuthUser {
  const payload = decodeJwt(accessToken);

  const realmRoles  = payload.realm_access?.roles ?? [];
  const clientRoles = payload.resource_access?.['soundmeet-api']?.roles ?? [];
  const roles       = [...new Set([...realmRoles, ...clientRoles])];

  // O aggregate Musician/Audience é criado com ID == sub do Keycloak (roadmap 1.9),
  // então dá pra derivar o profile id direto da claim de role — sem precisar de um
  // claim dedicado nem de um fetch de perfil extra no login/restoreSession.
  return {
    userId:          payload.sub,
    musicianId:      roles.includes('musician') ? payload.sub : null,
    audienceId:      roles.includes('audience') ? payload.sub : null,
    establishmentId: payload.establishment_ids?.[0] ?? null,
    roles,
    email:           payload.email ?? null,
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────────

// Forma comum às duas origens de sessão: o `TokenResponse` do expo-auth-session
// (Google/PKCE) já tem estes campos, e a resposta da nossa API é convertida
// para eles por `fromPasswordSession`.
type SessionTokens = Pick<TokenResponse, 'accessToken' | 'refreshToken' | 'idToken' | 'expiresIn'>;

function fromPasswordSession(tokens: PasswordSessionTokens): SessionTokens {
  return {
    accessToken:  tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn:    tokens.expires_in,
  };
}

function sessionChannelOf(accessToken: string) {
  return resolveSessionChannel(decodeJwt(accessToken).azp, CLIENT_ID);
}

async function persistAndApplyTokens(response: SessionTokens): Promise<void> {
  const tokens: StoredTokens = {
    accessToken:  response.accessToken,
    refreshToken: response.refreshToken ?? '',
    idToken:      response.idToken ?? undefined,
    expiresAt:    Date.now() + (response.expiresIn ?? 900) * 1_000,
  };

  await saveTokens(tokens);

  const user  = buildAuthUser(tokens.accessToken);
  const store = useAuthStore.getState();
  store.setUser(user);
  store.setAccessToken(tokens.accessToken);
}

function getRedirectUri(): string {
  return makeRedirectUri({ scheme: 'soundmeet', path: 'auth/callback' });
}

// ── Public API ─────────────────────────────────────────────────────────────────

export const ESTABLISHMENT_LOGIN_MESSAGE =
  'Esta é uma conta de estabelecimento. Acesse o painel pelo site do SoundMeet.';

export type LoginResult =
  | 'success'
  /** Conta de estabelecimento: persona web-only, o app não tem navegação. */
  | 'establishment-only'
  /** Identidade existe no Keycloak mas ainda não escolheu papel no SoundMeet. */
  | 'needs-role-selection';

// Fluxo Authorization Code + PKCE — hoje só o login com Google (kc_idp_hint faz
// o Keycloak redirecionar direto pro provedor). O login por senha saiu daqui
// no AUTH-3 e é nativo (`loginWithPassword`).
async function runAuthorizationCodeFlow(
  extraParams?: Record<string, string>,
): Promise<TokenResponse | 'dismissed'> {
  const redirectUri = getRedirectUri();

  const request = new AuthRequest({
    clientId:    CLIENT_ID,
    scopes:      SCOPES,
    redirectUri,
    usePKCE:     true,
    extraParams,
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type === 'error') {
    throw new Error(result.error?.message ?? 'Authentication failed');
  }

  if (result.type !== 'success') {
    return 'dismissed'; // user closed the browser
  }

  return exchangeCodeAsync(
    {
      clientId:    CLIENT_ID,
      code:        result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier! },
    },
    discovery
  );
}

/*
 * Login por e-mail e senha, com a tela DENTRO do app (AUTH-3, 25/set/2026).
 *
 * 🔴 Não é a volta ao desenho anterior ao AUTH-1. Lá a senha ia para um grant
 * no client PÚBLICO — cujo `client_id` está neste APK —, e dava para bater
 * direto no Keycloak pulando o rate limit da API. Agora a senha vai só para
 * `POST /auth/login`, que faz o grant no client CONFIDENCIAL (secret só no
 * servidor): este app não tem como falar `grant_type=password` com o
 * Keycloak, e nem precisa.
 *
 * O Google continua pelo navegador (`loginWithGoogle`): o Google recusa login
 * em WebView, e o consentimento dele tem de ser a tela dele.
 */
export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const tokens = fromPasswordSession(await requestPasswordLogin(email, password));
  const user = buildAuthUser(tokens.accessToken);

  /*
   * 🔴 A checagem de papel vem ANTES de persistir: `RootNavigator` decide o
   * stack por `isAuthenticated` + `isAudience`, então uma sessão sem papel de
   * app cairia no ramo do músico com `musicianId` nulo — tela quebrada, sem
   * erro visível. A sessão recusada é revogada no provedor (best-effort):
   * senão ela ficaria aberta no Keycloak até vencer, sem dono no aparelho.
   */
  if (!user.musicianId && !user.audienceId) {
    if (tokens.refreshToken) {
      requestSessionRevocation(tokens.refreshToken).catch(() => undefined);
    }
    return user.roles.includes('establishment')
      ? 'establishment-only'
      : 'needs-role-selection';
  }

  await persistAndApplyTokens(tokens);
  return 'success';
}

export type GoogleLoginResult = 'existing-user' | 'needs-role-selection' | 'dismissed';

// Login via Google (broker do realm) — kc_idp_hint pula a tela de login do
// Keycloak e vai direto pro consentimento do Google. A identidade pode já ter
// sido cadastrada por senha antes (roles preenchidas) ou pode ser totalmente
// nova no SoundMeet (roles vazias) — nesse segundo caso NUNCA tocamos em
// auth.store, pois isAuthenticated=true sem role derrubaria o usuário direto
// em MusicianTabs sem nunca escolher papel (RootNavigator só verifica
// isAuthenticated + wizard gate, não a presença de roles).
export async function loginWithGoogle(): Promise<GoogleLoginResult> {
  const tokens = await runAuthorizationCodeFlow({ kc_idp_hint: 'google' });
  if (tokens === 'dismissed') return 'dismissed';

  const user = buildAuthUser(tokens.accessToken);

  if (user.roles.length > 0) {
    await persistAndApplyTokens(tokens);
    return 'existing-user';
  }

  usePendingGoogleSessionStore.getState().setSession({
    accessToken:  tokens.accessToken,
    refreshToken: tokens.refreshToken ?? '',
    expiresAt:    Date.now() + (tokens.expiresIn ?? 900) * 1_000,
    email:        user.email,
  });
  return 'needs-role-selection';
}

// Wrapper puro sobre refreshAsync — usado só pra renovar o token da sessão
// Google pendente depois do social-signup atribuir a role (o token antigo foi
// emitido antes da role existir), sem tocar em nenhuma store.
export async function refreshWithRefreshToken(refreshToken: string): Promise<TokenResponse> {
  return refreshAsync({ clientId: CLIENT_ID, refreshToken }, discovery);
}

export async function logout(): Promise<void> {
  const stored = await getTokens().catch(() => null);

  await clearLocalSession();

  // Best-effort — falha de rede não impede ninguém de sair. Cada sessão é
  // revogada por quem a emitiu (ver `session-channel.ts`).
  if (stored?.refreshToken) {
    const revocation =
      sessionChannelOf(stored.accessToken) === 'api'
        ? requestSessionRevocation(stored.refreshToken)
        : revokeAsync(
            {
              clientId:      CLIENT_ID,
              token:         stored.refreshToken,
              tokenTypeHint: TokenTypeHint.RefreshToken,
            },
            discovery
          );
    revocation.catch(() => undefined);
  }
}

export async function refreshTokens(): Promise<string> {
  const stored = await getTokens();
  if (!stored?.refreshToken) throw new Error('No refresh token available');

  const response: SessionTokens =
    sessionChannelOf(stored.accessToken) === 'api'
      ? fromPasswordSession(await requestSessionRefresh(stored.refreshToken))
      : await refreshAsync({ clientId: CLIENT_ID, refreshToken: stored.refreshToken }, discovery);

  await persistAndApplyTokens(response);
  return response.accessToken;
}

export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState();
  store.setLoading(true);

  try {
    const stored = await getTokens();

    if (!stored) {
      // `clearLocalSession()` e não `store.clear()`, mesmo parecendo que não há
      // nada a limpar: `getTokens()` devolve null se QUALQUER um dos três
      // campos obrigatórios faltar, então "sem sessão" inclui o caso do
      // conjunto PARCIAL — um refresh token válido no SecureStore sem o
      // `expiresAt` ao lado. Nesse caso limpar só a memória deixaria a
      // credencial órfã no aparelho para sempre, já que nenhum caminho futuro
      // voltaria a enxergá-la. Não é redundância; é o mesmo SM-018 num ramo
      // menos óbvio.
      await clearLocalSession();
      return;
    }

    if (isTokenExpired(stored.expiresAt)) {
      await refreshTokens();
      return;
    }

    const user = buildAuthUser(stored.accessToken);
    store.setUser(user);
    store.setAccessToken(stored.accessToken);
  } catch {
    // Token corrompido ou refresh recusado — logout forçado.
    await clearLocalSession();
  } finally {
    store.setLoading(false);
  }
}
