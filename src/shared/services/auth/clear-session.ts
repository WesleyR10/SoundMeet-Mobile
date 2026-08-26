import { useAuthStore } from './auth.store';
import { clearTokens } from '../storage/token.storage';

/**
 * Encerramento LOCAL da sessão — a única forma de apagar sessão neste app.
 *
 * Existe porque havia três caminhos de logout com três comportamentos (SM-018):
 * `logout()` limpava SecureStore + store, `restoreSession()` limpava os dois no
 * catch, e o interceptor de 401 limpava **só a store**. Nesse terceiro caminho
 * o app voltava para a tela de login enquanto o refresh token continuava
 * gravado no aparelho, sobrevivendo até alguém reabrir o app e o
 * `restoreSession()` tropeçar nele de novo. Sessão que a UI já declarou
 * encerrada não pode continuar existindo no disco.
 *
 * Ordem deliberada: **disco primeiro, memória depois** — o `await` garante que
 * a credencial já saiu do aparelho quando a UI reage à store vazia e navega
 * para o login. O inverso mostraria a tela de login com o token ainda gravado,
 * que é precisamente o estado que este módulo existe para impedir. Mesma ordem
 * de `PurgeExpiredAiAudioStemsUseCase` (storage antes do banco), pelo mesmo
 * motivo: o registro durável manda.
 *
 * `clearTokens()` é best-effort por chave (apagar chave inexistente lança em
 * algumas plataformas, daí o catch lá dentro) e por isso esta função não
 * rejeita — o chamador nunca fica sem saída para deslogar.
 *
 * Não fala com a rede de propósito. Revogar o refresh token no Keycloak é
 * best-effort e pertence a `logout()`; falha de rede não pode impedir alguém de
 * sair do app.
 */
export async function clearLocalSession(): Promise<void> {
  await clearTokens();
  useAuthStore.getState().clear();
}
