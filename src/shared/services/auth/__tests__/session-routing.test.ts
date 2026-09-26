import { refreshAsync, revokeAsync } from 'expo-auth-session';
import {
  requestPasswordLogin,
  requestSessionRefresh,
  requestSessionRevocation,
} from '../password-session.api';
import { getTokens, saveTokens } from '../../storage/token.storage';
import { loginWithPassword, logout, refreshTokens } from '../keycloak.service';

/*
 * 🔴 O defeito que motivou este arquivo: o app renovava TODA sessão no client
 * público `soundmeet-mobile`, e o Keycloak recusa refresh token de client
 * diferente do emissor. A sessão do cadastro (client confidencial) morria na
 * primeira renovação. Estes testes travam o roteamento pelo `azp`.
 */

jest.mock('expo-auth-session', () => ({
  AuthRequest:       jest.fn(),
  exchangeCodeAsync: jest.fn(),
  makeRedirectUri:   jest.fn(() => 'soundmeet://auth/callback'),
  refreshAsync:      jest.fn(),
  revokeAsync:       jest.fn(),
  TokenTypeHint:     { RefreshToken: 'refresh_token' },
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('@/shared/services/config/env', () => ({
  ENV: {
    API_BASE_URL: 'http://api.test/api/v1',
    KEYCLOAK: { URL: 'http://kc.test', REALM: 'soundmeet', CLIENT_ID: 'soundmeet-mobile' },
  },
}));
jest.mock('../password-session.api', () => ({
  requestPasswordLogin:     jest.fn(),
  requestSessionRefresh:    jest.fn(),
  requestSessionRevocation: jest.fn(),
}));
jest.mock('../../storage/token.storage', () => ({
  saveTokens:     jest.fn().mockResolvedValue(undefined),
  getTokens:      jest.fn(),
  clearTokens:    jest.fn().mockResolvedValue(undefined),
  isTokenExpired: jest.fn(() => false),
}));

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256' })}.${encode({ exp: 9999999999, sub: 'user-1', ...payload })}.sig`;
}

const musicianToken = (azp: string) => jwt({ azp, realm_access: { roles: ['musician'] } });

const mocked = <T extends (...args: never[]) => unknown>(fn: T) => fn as unknown as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('refreshTokens — cada sessão renova por quem a emitiu', () => {
  it('sessão do login por senha/cadastro renova pela API', async () => {
    mocked(getTokens).mockResolvedValue({
      accessToken: musicianToken('soundmeet-registration'),
      refreshToken: 'r-api',
      expiresAt: 0,
    });
    mocked(requestSessionRefresh).mockResolvedValue({
      access_token: musicianToken('soundmeet-registration'),
      refresh_token: 'r-api-2',
      expires_in: 900,
      token_type: 'Bearer',
    });

    await refreshTokens();

    expect(requestSessionRefresh).toHaveBeenCalledWith('r-api');
    expect(refreshAsync).not.toHaveBeenCalled();
    expect(mocked(saveTokens).mock.calls[0][0].refreshToken).toBe('r-api-2');
  });

  it('sessão do Google (PKCE) renova direto no Keycloak', async () => {
    mocked(getTokens).mockResolvedValue({
      accessToken: musicianToken('soundmeet-mobile'),
      refreshToken: 'r-kc',
      expiresAt: 0,
    });
    mocked(refreshAsync).mockResolvedValue({
      accessToken: musicianToken('soundmeet-mobile'),
      refreshToken: 'r-kc-2',
      expiresIn: 900,
    });

    await refreshTokens();

    expect(refreshAsync).toHaveBeenCalledTimes(1);
    expect(requestSessionRefresh).not.toHaveBeenCalled();
  });
});

describe('logout — revoga pelo mesmo canal', () => {
  it('sessão da API é revogada pela API', async () => {
    mocked(getTokens).mockResolvedValue({
      accessToken: musicianToken('soundmeet-registration'),
      refreshToken: 'r-api',
      expiresAt: 0,
    });
    mocked(requestSessionRevocation).mockResolvedValue(undefined);

    await logout();

    expect(requestSessionRevocation).toHaveBeenCalledWith('r-api');
    expect(revokeAsync).not.toHaveBeenCalled();
  });
});

describe('loginWithPassword', () => {
  it('abre a sessão de quem tem papel no app', async () => {
    mocked(requestPasswordLogin).mockResolvedValue({
      access_token: musicianToken('soundmeet-registration'),
      refresh_token: 'r',
      expires_in: 900,
      token_type: 'Bearer',
    });

    await expect(loginWithPassword('a@b.com', 'x')).resolves.toBe('success');
    expect(saveTokens).toHaveBeenCalledTimes(1);
  });

  it('conta de estabelecimento: NÃO grava sessão e revoga a que o provedor abriu', async () => {
    mocked(requestPasswordLogin).mockResolvedValue({
      access_token: jwt({ azp: 'soundmeet-registration', realm_access: { roles: ['establishment'] } }),
      refresh_token: 'r-est',
      expires_in: 900,
      token_type: 'Bearer',
    });
    mocked(requestSessionRevocation).mockResolvedValue(undefined);

    await expect(loginWithPassword('bar@b.com', 'x')).resolves.toBe('establishment-only');
    expect(saveTokens).not.toHaveBeenCalled();
    expect(requestSessionRevocation).toHaveBeenCalledWith('r-est');
  });
});
