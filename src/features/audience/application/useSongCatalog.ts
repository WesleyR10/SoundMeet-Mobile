import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchSongCatalog } from '../infrastructure/repertoire.api';

const DEBOUNCE_MS = 400;

export const songCatalogKey = (musicianId: string, term: string) =>
  ['song-catalog', musicianId, term] as const;

/**
 * Catálogo para o fã escolher a música que vai pedir.
 *
 * Busca vazia é caso de PRIMEIRA CLASSE, não estado desligado: ao abrir a tela
 * o fã já vê músicas sem digitar nada — é o que transforma o campo de texto
 * livre em catálogo navegável. Por isso não há `enabled` amarrado ao tamanho
 * do termo (o `useCifraSearch` do músico exige 2 caracteres porque lá a busca
 * é contra provedor externo, sem lista base).
 *
 * O debounce existe pelo `@Throttle(30/min)` próprio da rota: sem ele, digitar
 * "Garota de Ipanema" gastaria 17 das 30 chamadas do minuto.
 *
 * ⚠️ O `scope` da resposta vem do MÚSICO e pode mudar entre uma sessão e
 * outra; por isso ele é lido da resposta a cada busca, nunca guardado como
 * estado do formulário.
 */
export function useSongCatalog(musicianId: string | null, query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debounced.trim();

  return useQuery({
    queryKey: songCatalogKey(musicianId ?? 'none', trimmed),
    queryFn:  () => searchSongCatalog(musicianId!, { term: trimmed || undefined }),
    enabled:  !!musicianId,
    // O catálogo muda em escala de dias, não de segundos — e o fã costuma
    // voltar à tela depois de errar o pedido. 5 min poupa o throttle da rota.
    staleTime: 5 * 60 * 1_000,
  });
}
