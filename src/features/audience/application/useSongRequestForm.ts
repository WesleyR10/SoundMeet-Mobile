import { useState } from 'react';
import type { PublicRepertoireItem } from '../domain/repertoire.types';
import { catalogGenre, stillMatchesPick } from '../domain/song-request.rules';
import type { SongRequestSuggestion } from '../domain/request.types';
import { useMusicianRepertoire } from './useMusicianRepertoire';

/**
 * Estado do formulário de pedido de música.
 *
 * Mora em `application/` — e não ao lado da tela, como o `useEditProfileForm`
 * do músico — porque orquestra uma query (`useMusicianRepertoire`) além do
 * estado de campo, e é a camada que o `CLAUDE.md` reserva para isso ("lógica
 * de negócio aqui, não em `ui/`").
 *
 * O que ele guarda que não é óbvio: **`pickedSong` não é derivável do texto**.
 * O fã pode escolher no catálogo e depois editar o título; a partir daí não é
 * mais aquela linha do repertório, e o gênero herdado deixaria de valer.
 */
export function useSongRequestForm(musicianId: string | null) {
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [message, setMessage] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [pickedSong, setPickedSong] = useState<PublicRepertoireItem | null>(null);

  const repertoireQuery = useMusicianRepertoire(musicianId, catalogQuery);

  function selectFromCatalog(item: PublicRepertoireItem) {
    setSongTitle(item.title);
    setArtistName(item.artist);
    setPickedSong(item);
  }

  function selectSuggestion(suggestion: SongRequestSuggestion) {
    setSongTitle(suggestion.song_title);
    if (suggestion.artist) setArtistName(suggestion.artist);
    // Sugestão vem do HISTÓRICO de pedidos, não do catálogo — não há item de
    // repertório por trás, então um gênero escolhido antes deixaria de
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
    catalogItems:   repertoireQuery.data?.data ?? [],
    catalogPending: repertoireQuery.isPending,
    pickedSong,
    selectFromCatalog,
    selectSuggestion,
    /** Gênero a enviar — `null` quando o pedido não veio (mais) do catálogo. */
    genre: catalogGenre(pickedSong, songTitle, artistName),

    isComplete: songTitle.trim().length > 0 && artistName.trim().length > 0,
  };
}
