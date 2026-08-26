import { buildAuthUser } from './keycloak.service';
import { useAuthStore, type AuthUser } from './auth.store';
import { clearLocalSession } from './clear-session';
import { saveTokens, type StoredTokens } from '../storage/token.storage';

export type TokenSessionResponse = {
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
  role:          'musician' | 'audience';
  profile_id:    string;
};

// Núcleo comum de sessão a partir de uma resposta com tokens (register/login):
// persiste no SecureStore, deriva o AuthUser do JWT e popula auth.store.
// `extend` permite que o chamador injete campos adicionais (ex.: cpf/phone
// vindos do formulário de cadastro) antes do commit no store.
export async function applyTokenSession(
  response: TokenSessionResponse,
  extend?: (user: AuthUser) => void,
): Promise<void> {
  const tokens: StoredTokens = {
    accessToken:  response.access_token,
    refreshToken: response.refresh_token,
    expiresAt:    Date.now() + response.expires_in * 1_000,
  };

  await saveTokens(tokens);

  try {
    const user = buildAuthUser(tokens.accessToken);
    if (response.role === 'musician') {
      user.musicianId = response.profile_id;
    } else {
      user.audienceId = response.profile_id;
    }
    extend?.(user);

    const store = useAuthStore.getState();
    store.setUser(user);
    store.setAccessToken(tokens.accessToken);
  } catch (err) {
    // Evita deixar tokens órfãos no SecureStore sem estado correspondente no
    // auth.store — a conta já existe no backend nesse ponto, mas a sessão
    // local fica inconsistente.
    await clearLocalSession();
    throw err;
  }
}
