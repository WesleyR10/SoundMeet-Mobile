import type { SongCatalogItem } from './repertoire.types';

/**
 * Regras puras do pedido de música com catálogo (`RepertoirePicker`).
 *
 * Mesmo precedente de `request.rules.ts` e de `request-boost.rules.ts` do
 * músico: a decisão que pode dar errado em silêncio mora fora do componente,
 * onde dá para testar.
 */

/**
 * O texto digitado ainda corresponde ao item escolhido no catálogo?
 *
 * 🔴 É a trava contra **dado herdado**. O fã escolhe "Garota de Ipanema" do
 * catálogo, edita o título para "Garota de Ipanema (ao vivo)" e o pedido
 * continuaria carregando o gênero — e, pior, o `library_id` — da linha
 * original: fatos afirmados sobre uma música que não é mais aquela. Não quebra
 * nada, não aparece em log.
 *
 * ⚠️ Isto só existe porque os campos de texto continuam editáveis DEPOIS da
 * escolha, no modo `platform`. No modo `repertoire` não há texto livre: o
 * pedido é a linha escolhida, e a pergunta não chega a ser feita.
 *
 * A comparação é EXATA de propósito (sem `trim`, sem `toLowerCase`): qualquer
 * afrouxamento aqui volta a aceitar como "a mesma música" um texto que o fã
 * mudou justamente porque não era.
 */
export function stillMatchesPick(
  picked: SongCatalogItem | null,
  title: string,
  artist: string,
): boolean {
  if (!picked) return false;
  return picked.title === title && picked.artist === artist;
}

/**
 * Gênero a enviar no pedido — só quando veio do catálogo e ainda casa.
 *
 * `genre` é opcional em `MakeMusicRequestInputValidator` e consta do
 * `MakeMusicRequestDto`; com `forbidNonWhitelisted` ligado no backend (INP-1),
 * mandar `null` explícito seria um valor inválido para um `@IsString()`, então
 * quem chama omite a chave em vez de mandá-la vazia.
 */
export function catalogGenre(
  picked: SongCatalogItem | null,
  title: string,
  artist: string,
): string | null {
  if (!stillMatchesPick(picked, title, artist)) return null;
  return picked!.genre ?? null;
}

/**
 * `library_id` a enviar — a linha DESTE músico para a música escolhida.
 *
 * 🔴 Nulo em três situações diferentes, e as três são legítimas: o fã digitou
 * à mão; escolheu do catálogo e depois editou o texto; ou escolheu uma música
 * que a plataforma tem mas ESTE músico ainda não cadastrou (`library_id` nulo
 * na própria entrada). Nos três casos o pedido segue por título e artista — e
 * é o servidor, não esta função, que decide se isso basta.
 *
 * ⚠️ Nunca inventar um id aqui. `library_id` que não é do músico é recusado
 * pelo `CreateRequestUseCase` com 422, nos dois modos.
 */
export function catalogLibraryId(
  picked: SongCatalogItem | null,
  title: string,
  artist: string,
): string | null {
  if (!stillMatchesPick(picked, title, artist)) return null;
  return picked!.library_id;
}
