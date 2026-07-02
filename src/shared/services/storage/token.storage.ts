import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN:  'sm_access_token',
  REFRESH_TOKEN: 'sm_refresh_token',
  ID_TOKEN:      'sm_id_token',
  EXPIRES_AT:    'sm_expires_at',
} as const;

export interface StoredTokens {
  accessToken:  string;
  refreshToken: string;
  idToken?:     string;
  expiresAt:    number; // Unix ms
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN,  tokens.accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken),
    SecureStore.setItemAsync(KEYS.EXPIRES_AT,    String(tokens.expiresAt)),
    tokens.idToken
      ? SecureStore.setItemAsync(KEYS.ID_TOKEN, tokens.idToken)
      : SecureStore.deleteItemAsync(KEYS.ID_TOKEN).catch(() => undefined),
  ]);
}

export async function getTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken, idToken, expiresAtStr] = await Promise.all([
    SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.getItemAsync(KEYS.ID_TOKEN),
    SecureStore.getItemAsync(KEYS.EXPIRES_AT),
  ]);

  if (!accessToken || !refreshToken || !expiresAtStr) return null;

  return {
    accessToken,
    refreshToken,
    idToken:   idToken ?? undefined,
    expiresAt: Number(expiresAtStr),
  };
}

export async function clearTokens(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) =>
      SecureStore.deleteItemAsync(key).catch(() => undefined)
    )
  );
}

export function isTokenExpired(expiresAt: number, bufferMs = 60_000): boolean {
  return Date.now() >= expiresAt - bufferMs;
}
