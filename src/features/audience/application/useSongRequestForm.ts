import { useState } from 'react';
import type { SongCatalogItem } from '../domain/repertoire.types';
import {
  catalogGenre,
  catalogLibraryId,
  stillMatchesPick,
} from '../domain/song-request.rules';
import type { SongRequestSuggestion } from '../domain/request.types';
import { useSongCatalog } from './useSongCatalog';

/**
 * Estado do formulário de pedido de música.
 *
 * Mora em `application/` — e não ao lado da tela, como o `useEditProfileForm`
 * do músico — porque orquestra uma query (`useSongCatalog`) além do estado de
 * campo, e é a camada que o `CLAUDE.md` reserva para isso ("lógica de negócio
 * aqui, não em `ui/`").
 *
 * O que ele guarda que não é óbvio: **`pickedSong` não é derivável do texto**.
 * No modo `platform` o fã pode escolher no catálogo e depois editar o título;
 * a partir daí não é mais aquela linha, e gênero e `library_id` herdados
 * deixariam de valer.
 *
 * 🔴 **`isRestricted` não é uma preferência de UI.** Quando o músico desligou
 * o pedido fora do repertório, o servidor RECUSA um pedido sem `library_id`
 * dele (`CreateRequestUseCase` → 422). Esconder o texto livre aqui é o que
 * evita o fã escrever um pedido inteiro para levar um erro no envio — não é o
 * que impõe o limite.
 */
export function useSongRequestForm(musicianId: string | null) {
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [message, setMessage] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [pickedSong, setPickedSong] = useState<SongCatalogItem | null>(null);

  const catalogQueryResult = useSongCatalog(musicianId, catalogQuery);
  const scope = catalogQueryResult.data?.scope ?? null;
  // Enquanto a primeira resposta não chega, `scope` é nulo e a tela trata como
  // NÃO restrito: mostrar "só o repertório" antes de saber seria afirmar um
  // limite que talvez não exista.
  const isRestricted = scope === 'repertoire';

  function selectFromCatalog(item: SongCatalogItem) {
    setSongTitle(item.title);
    setArtistName(item.artist);
    setPickedSong(item);
  }

  function selectSuggestion(suggestion: SongRequestSuggestion) {
    setSongTitle(suggestion.song_title);
    if (suggestion.artist) setArtistName(suggestion.artist);
    // Sugestão vem do HISTÓRICO de pedidos, não do catálogo — não há entrada
    // por trás, então gênero e `library_id` escolhidos antes deixariam de
    // corresponder à música.
    setPickedSong(null);
  }

  // 🔴 Editar o texto à mão desfaz a escolha do catálogo — o porquê (e os
  // casos de borda) estão em `stillMatchesPick`, que é onde isso é testado.
  function changeTitle(value: string) {
    setSongTitle(value);
    if (!stillMatchesPick(pickedSong, value, artistName)) setPickedSong(null);
  }

  function changeArtist(value: string) {
    setArtistName(value);
    if (!stillMatchesPick(pickedSong, songTitle, value)) setPickedSong(null);
  }

  return {
    songTitle,
    artistName,
    message,
    setMessage,
    changeTitle,
    changeArtist,

    catalogQuery,
    setCatalogQuery,
    catalogItems:   catalogQueryResult.data?.items ?? [],
    catalogPending: catalogQueryResult.isPending,
    scope,
    isRestricted,
    pickedSong,
    selectFromCatalog,
    selectSuggestion,
    /** Gênero a enviar — `null` quando o pedido não veio (mais) do catálogo. */
    genre: catalogGenre(pickedSong, songTitle, artistName),
    /** Linha do músico para a música — `null` quando ele ainda não a tem. */
    libraryId: catalogLibraryId(pickedSong, songTitle, artistName),

    /*
     * No modo restrito, "completo" exige a ESCOLHA, não o texto: o servidor
     * não aceita pedido sem `library_id` deste músico, e um botão habilitado
     * levaria o fã direto a um 422.
     */
    isComplete: isRestricted
      ? pickedSong !== null && pickedSong.library_id !== null
      : songTitle.trim().length > 0 && artistName.trim().length > 0,
  };
}
