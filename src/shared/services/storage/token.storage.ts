import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN:  'sm_access_token',
  REFRESH_TOKEN: 'sm_refresh_token',
  ID_TOKEN:      'sm_id_token',
  EXPIRES_AT:    'sm_expires_at',
} as const;

/**
 * Acessibilidade do Keychain para os tokens de sessão (SM-018).
 *
 * `THIS_DEVICE_ONLY` é a metade que importa: sem ele o item entra no backup
 * cifrado do iCloud e é **restaurado em outro aparelho** junto com o resto do
 * app — um refresh token válido migrando para um device que a pessoa pode nem
 * controlar mais. É o CWE-922 do achado.
 *
 * `AFTER_FIRST_UNLOCK_` e não `WHEN_UNLOCKED_`, embora o achado sugerisse o
 * segundo: `WHEN_UNLOCKED` torna o item ilegível **enquanto a tela está
 * bloqueada**, e o refresh de token pode cair exatamente aí (upload de áudio
 * longo, set ao vivo com o celular bloqueado no tripé). O `saveTokens` falharia,
 * `refreshTokens()` lançaria e o interceptor derrubaria a sessão — logout falso
 * no meio de um show. `AFTER_FIRST_UNLOCK` entrega a mesma proteção contra
 * extração e backup, exigindo só que o aparelho tenha sido desbloqueado uma vez
 * desde o boot. É o nível que AppAuth, Auth0 e MSAL usam para refresh token.
 *
 * Android ignora esta opção — lá a proteção equivalente vem do plugin
 * `expo-secure-store` em app.json, que aplica `configureAndroidBackup: true`
 * por padrão (regras de backup + data extraction) e mantém a chave no Keystore,
 * que não é exportável.
 *
 * Migração é transparente: `getItemAsync` não filtra por acessibilidade, então
 * item já gravado com o default continua legível e é reescrito com o atributo
 * novo no primeiro refresh.
 */
const TOKEN_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export interface StoredTokens {
  accessToken:  string;
  refreshToken: string;
  idToken?:     string;
  expiresAt:    number; // Unix ms
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN,  tokens.accessToken,  TOKEN_STORE_OPTIONS),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken, TOKEN_STORE_OPTIONS),
    SecureStore.setItemAsync(KEYS.EXPIRES_AT,    String(tokens.expiresAt), TOKEN_STORE_OPTIONS),
    tokens.idToken
      ? SecureStore.setItemAsync(KEYS.ID_TOKEN, tokens.idToken, TOKEN_STORE_OPTIONS)
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
