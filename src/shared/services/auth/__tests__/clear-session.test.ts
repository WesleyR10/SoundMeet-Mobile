import { clearLocalSession } from '../clear-session';
import { useAuthStore } from '../auth.store';
import { clearTokens } from '../../storage/token.storage';

// O ponto do SM-018 não é "limpar a store" nem "limpar o SecureStore" — é que
// os dois aconteçam SEMPRE juntos, em qualquer caminho de logout. O teste
// trava as duas metades e a ordem entre elas.

jest.mock('../../storage/token.storage', () => ({
  clearTokens: jest.fn().mockResolvedValue(undefined),
}));

const clearTokensMock = clearTokens as jest.MockedFunction<typeof clearTokens>;

function givenAuthenticatedSession() {
  useAuthStore.getState().setUser({
    userId: 'sub-123',
    musicianId: 'sub-123',
    audienceId: null,
    establishmentId: null,
    roles: ['musician'],
    email: 'musico@exemplo.com',
  });
  useAuthStore.getState().setAccessToken('token-de-acesso');
}

describe('clearLocalSession', () => {
  beforeEach(() => {
    clearTokensMock.mockClear();
    clearTokensMock.mockResolvedValue(undefined);
  });

  it('apaga o SecureStore E a store de memória', async () => {
    givenAuthenticatedSession();

    await clearLocalSession();

    expect(clearTokensMock).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('apaga o disco ANTES de a store esvaziar', async () => {
    // A UI navega para o login reagindo à store; se ela esvaziasse primeiro, a
    // tela de login apareceria com o refresh token ainda gravado no aparelho.
    givenAuthenticatedSession();

    let storeAindaAutenticadaQuandoApagouODisco: boolean | null = null;
    clearTokensMock.mockImplementation(async () => {
      storeAindaAutenticadaQuandoApagouODisco = useAuthStore.getState().isAuthenticated;
    });

    await clearLocalSession();

    expect(storeAindaAutenticadaQuandoApagouODisco).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('deixa isLoading em false — RootNavigator não pode ficar no splash', async () => {
    givenAuthenticatedSession();
    useAuthStore.getState().setLoading(true);

    await clearLocalSession();

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('é idempotente — deslogar duas vezes não quebra', async () => {
    await clearLocalSession();
    await expect(clearLocalSession()).resolves.toBeUndefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
