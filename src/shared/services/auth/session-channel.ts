/**
 * Por onde renovar e revogar uma sessão.
 *
 * 🔴 O Keycloak só aceita o refresh token do MESMO client que o emitiu. O app
 * tem sessões de duas origens:
 *  - `keycloak`: login com Google (PKCE no client público `soundmeet-mobile`) —
 *    o app fala direto com o Keycloak, como sempre falou;
 *  - `api`: login por senha e cadastro, emitidos pelo client CONFIDENCIAL do
 *    backend — só a nossa API tem o secret para renovar e revogar.
 *
 * Até o AUTH-3 tudo era renovado como `keycloak`, e a sessão do cadastro era
 * recusada na primeira renovação: quem acabava de criar conta caía no login
 * uns 15 minutos depois, sem erro nenhum na tela.
 *
 * A origem é lida do `azp` do próprio access token, não de um campo gravado à
 * parte: sessões já salvas no aparelho continuam funcionando sem migração, e
 * não existe como o campo e o token discordarem.
 */
export type SessionChannel = 'keycloak' | 'api';

export function resolveSessionChannel(azp: unknown, mobileClientId: string): SessionChannel {
  return azp === mobileClientId ? 'keycloak' : 'api';
}
