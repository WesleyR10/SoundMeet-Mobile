import type { PublicRepertoireItem } from './repertoire.types';

/**
 * Regras puras do pedido de música com catálogo (`RepertoirePicker`).
 *
 * Mesmo precedente de `request.rules.ts` e de `request-boost.rules.ts` do
 * músico: a decisão que pode dar errado em silêncio mora fora do componente,
 * onde dá para testar.
 */

/**
 * O texto digitado ainda corresponde ao item escolhido no repertório?
 *
 * 🔴 É a trava contra **dado herdado**. O fã escolhe "Garota de Ipanema" do
 * catálogo, edita o título para "Garota de Ipanema (ao vivo)" e o pedido
 * continuaria carregando o gênero da linha original — um fato afirmado sobre
 * uma música que não é mais aquela. Não quebra nada, não aparece em log: o
 * pedido chega ao músico com um gênero que ninguém escolheu.
 *
 * A comparação é EXATA de propósito (sem `trim`, sem `toLowerCase`): qualquer
 * afrouxamento aqui volta a aceitar como "a mesma música" um texto que o fã
 * mudou justamente porque não era.
 */
export function stillMatchesPick(
  picked: PublicRepertoireItem | null,
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
  picked: PublicRepertoireItem | null,
  title: string,
  artist: string,
): string | null {
  if (!stillMatchesPick(picked, title, artist)) return null;
  return picked!.genre ?? null;
}
