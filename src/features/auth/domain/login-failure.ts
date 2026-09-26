/**
 * O que dizer quando o login falha — puro, para o texto ser testável sem axios.
 *
 * `status` null = nenhuma resposta do servidor (rede, timeout).
 *
 * 🔴 O backend responde o MESMO 401 para senha errada, e-mail inexistente e
 * conta bloqueada pelo brute force — é o que impede a tela de revelar quem tem
 * conta. O custo é que alguém com a senha certa, mas com a conta bloqueada por
 * alguns minutos, lê "incorretos" e não entende. Por isso, a partir da terceira
 * recusa seguida, o texto passa a mencionar a proteção. Ele aparece igual
 * exista a conta ou não, então não vaza nada.
 */
export const LOCKOUT_HINT_AFTER = 3;

export function describeLoginFailure(status: number | null, consecutiveRejections: number): string {
  if (status === null) {
    return 'Sem conexão com o SoundMeet. Confira sua internet e tente de novo.';
  }
  if (status === 401) {
    return consecutiveRejections >= LOCKOUT_HINT_AFTER
      ? 'E-mail ou senha incorretos. Depois de várias tentativas, a conta fica protegida por alguns minutos — se esqueceu a senha, crie uma nova.'
      : 'E-mail ou senha incorretos.';
  }
  if (status === 429) {
    return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  }
  return 'Não conseguimos entrar agora. Tente de novo em instantes.';
}
