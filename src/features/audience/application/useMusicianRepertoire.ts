import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMusicianRepertoire } from '../infrastructure/repertoire.api';

const DEBOUNCE_MS = 400;

export const musicianRepertoireKey = (musicianId: string, title: string) =>
  ['musician-repertoire', musicianId, title] as const;

/**
 * Catálogo do músico para o fã escolher a música que vai pedir.
 *
 * Busca vazia é caso de PRIMEIRA CLASSE, não estado desligado: ao abrir a tela
 * o fã vê as primeiras músicas do repertório sem digitar nada — é o que
 * transforma o campo de texto livre em catálogo navegável. Por isso não há
 * `enabled` amarrado ao tamanho do termo (o `useCifraSearch` do músico exige 2
 * caracteres porque lá a busca é contra provedor externo, sem lista base).
 *
 * O debounce existe pelo `@Throttle(30/min)` próprio da rota: sem ele, digitar
 * "Garota de Ipanema" gastaria 17 das 30 chamadas do minuto.
 */
export function useMusicianRepertoire(musicianId: string | null, query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debounced.trim();

  return useQuery({
    queryKey:  musicianRepertoireKey(musicianId ?? 'none', trimmed),
    queryFn:   () => searchMusicianRepertoire(musicianId!, { title: trimmed || undefined }),
    enabled:   !!musicianId,
    // O repertório muda em escala de dias, não de segundos — e o fã costuma
    // voltar à tela depois de errar o pedido. 5 min poupa o throttle da rota.
    staleTime: 5 * 60 * 1_000,
  });
}
