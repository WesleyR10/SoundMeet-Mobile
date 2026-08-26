import { httpClient } from '../client';
import { clearLocalSession } from '@/shared/services/auth/clear-session';
import { refreshTokens } from '@/shared/services/auth/keycloak.service';

// O defeito do SM-018 morava AQUI, não em clear-session.ts: o interceptor
// chamava `authStore.clear()` e ia embora, deixando o refresh token inválido
// gravado no SecureStore. Um teste só do clear-session continuaria verde se
// alguém reintroduzisse `authStore.clear()` nesta linha — por isso este arquivo
// existe: ele trava o comportamento no ponto onde a regressão acontece.

jest.mock('@/shared/services/auth/clear-session', () => ({
  clearLocalSession: jest.fn().mockResolvedValue(undefined),
}));

// O import de keycloak.service em client.ts é estático desde a revisão do
// SM-018 — era `await import()`, que escapava do registry de módulos do Jest e
// tornava este caminho intestável.
jest.mock('@/shared/services/auth/keycloak.service', () => ({
  refreshTokens: jest.fn(),
}));

const clearLocalSessionMock = clearLocalSession as jest.MockedFunction<typeof clearLocalSession>;
const refreshTokensMock = refreshTokens as jest.MockedFunction<typeof refreshTokens>;

/** Adapter que sempre responde com o status pedido, sem tocar na rede. */
function respondWith(status: number) {
  return jest.fn(async (config: any) => {
    const error: any = new Error(`Request failed with status code ${status}`);
    error.isAxiosError = true;
    error.config = config;
    error.response = { status, data: {}, headers: {}, config };
    throw error;
  });
}

describe('interceptor de 401 — logout reativo', () => {
  beforeEach(() => {
    clearLocalSessionMock.mockClear().mockResolvedValue(undefined);
    refreshTokensMock.mockReset();
  });

  it('refresh recusado: encerra a sessão INTEIRA, não só a memória', async () => {
    httpClient.defaults.adapter = respondWith(401);
    refreshTokensMock.mockRejectedValue(new Error('invalid_grant'));

    await expect(httpClient.get('/musicians/me')).rejects.toThrow();

    expect(refreshTokensMock).toHaveBeenCalledTimes(1);
    expect(clearLocalSessionMock).toHaveBeenCalledTimes(1);
  });

  it('refresh bem-sucedido: NÃO desloga', async () => {
    // O 401 seguinte cai no guarda `_retry` e sobe como erro comum — o que não
    // pode acontecer é o app derrubar a sessão de quem acabou de renovar.
    httpClient.defaults.adapter = respondWith(401);
    refreshTokensMock.mockResolvedValue('token-novo');

    await expect(httpClient.get('/musicians/me')).rejects.toThrow();

    expect(refreshTokensMock).toHaveBeenCalledTimes(1);
    expect(clearLocalSessionMock).not.toHaveBeenCalled();
  });

  it('401 em /auth/login é "credencial inválida", não sessão expirada', async () => {
    httpClient.defaults.adapter = respondWith(401);

    await expect(httpClient.post('/auth/login', {})).rejects.toThrow();

    expect(refreshTokensMock).not.toHaveBeenCalled();
    expect(clearLocalSessionMock).not.toHaveBeenCalled();
  });

  it('403 e 500 não disparam refresh nem logout', async () => {
    for (const status of [403, 500]) {
      clearLocalSessionMock.mockClear();
      refreshTokensMock.mockReset();
      httpClient.defaults.adapter = respondWith(status);

      await expect(httpClient.get('/musicians/me')).rejects.toThrow();

      expect(refreshTokensMock).not.toHaveBeenCalled();
      expect(clearLocalSessionMock).not.toHaveBeenCalled();
    }
  });
});
