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
import {
  saveTokens,
  getTokens,
  clearTokens,
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

function buildAuthUser(accessToken: string): AuthUser {
  const payload = decodeJwt(accessToken);

  const realmRoles  = payload.realm_access?.roles ?? [];
  const clientRoles = payload.resource_access?.['soundmeet-api']?.roles ?? [];

  return {
    userId:          payload.sub,
    musicianId:      null, // populated in Bloco 2 after profile fetch
    audienceId:      null,
    establishmentId: payload.establishment_ids?.[0] ?? null,
    roles:           [...new Set([...realmRoles, ...clientRoles])],
    email:           payload.email ?? null,
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────────

async function persistAndApplyTokens(response: TokenResponse): Promise<void> {
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

export type LoginResult = 'success' | 'dismissed';

export async function login(): Promise<LoginResult> {
  const redirectUri = getRedirectUri();

  const request = new AuthRequest({
    clientId:    CLIENT_ID,
    scopes:      SCOPES,
    redirectUri,
    usePKCE:     true,
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type === 'error') {
    throw new Error(result.error?.message ?? 'Authentication failed');
  }

  if (result.type !== 'success') {
    return 'dismissed'; // user closed the browser
  }

  const tokens = await exchangeCodeAsync(
    {
      clientId:    CLIENT_ID,
      code:        result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier! },
    },
    discovery
  );

  await persistAndApplyTokens(tokens);
  return 'success';
}

export async function logout(): Promise<void> {
  const stored = await getTokens().catch(() => null);

  await clearTokens();
  useAuthStore.getState().clear();

  // Best-effort revocation — do not block or throw on failure
  if (stored?.refreshToken) {
    revokeAsync(
      {
        clientId:      CLIENT_ID,
        token:         stored.refreshToken,
        tokenTypeHint: TokenTypeHint.RefreshToken,
      },
      discovery
    ).catch(() => undefined);
  }
}

export async function refreshTokens(): Promise<string> {
  const stored = await getTokens();
  if (!stored?.refreshToken) throw new Error('No refresh token available');

  const response = await refreshAsync(
    { clientId: CLIENT_ID, refreshToken: stored.refreshToken },
    discovery
  );

  await persistAndApplyTokens(response);
  return response.accessToken;
}

export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState();
  store.setLoading(true);

  try {
    const stored = await getTokens();

    if (!stored) {
      store.clear();
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
    // Corrupt token or refresh failed — force logout
    await clearTokens().catch(() => undefined);
    store.clear();
  } finally {
    store.setLoading(false);
  }
}
