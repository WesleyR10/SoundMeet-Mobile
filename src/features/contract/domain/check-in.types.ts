/**
 * Registro da apresentação, visto pela tela do contrato.
 *
 * Subconjunto de `BookingPresenter` (`scheduling-module`) — só o que decide se
 * o botão de registrar aparece. O resto do booking já chega ao músico pelo
 * próprio contrato, com o texto **pronto** do backend
 * (`ContractShowSummary`), e reformatá-lo aqui criaria uma segunda verdade
 * sobre um documento congelado.
 *
 * ⚠️ Vive em `features/contract` e não em `features/scheduling` porque **o
 * contrato é a tela do show neste app** — o músico não tem tela de booking
 * (decisão registrada no `CLAUDE.md`), e é daqui que ele registra. Se um dia
 * `scheduling` precisar do mesmo dado, o caminho é promover para
 * `shared/services/`, como já foi feito com `performance` e `gamification` —
 * nunca `features/scheduling` importar daqui.
 */
export interface BookingCheckIn {
  id:            string;
  status:        string;
  /** ISO 8601 em UTC. */
  start_at:      string;
  end_at:        string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  disputed_at:   string | null;
}
