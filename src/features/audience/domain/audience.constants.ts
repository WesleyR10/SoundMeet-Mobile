// Lista canônica de gêneros — espelha VALID_GENRES em
// audience-preferences.vo.ts (backend). `favorite_genres` do fã É validado
// contra essa lista (422 se fora dela); `preferred_genres` de estabelecimento
// não tem enforcement, mas reaproveitamos a mesma lista pra consistência de
// filtro/exibição. Não importado de features/musician (FSD: nunca cruzar
// features) — duplicação pequena e intencional com musician.constants.ts.
export const GENRE_OPTIONS: string[] = [
  'Rock', 'Pop', 'Jazz', 'Blues', 'Country', 'Folk', 'Classical', 'Electronic',
  'House', 'Hip Hop', 'R&B', 'Reggae', 'Punk', 'Metal', 'Alternative', 'Indie',
  'Funk', 'Soul', 'Gospel', 'Latin', 'World Music', 'Instrumental', 'Acoustic',
  'MPB', 'Sertanejo', 'Forró', 'Bossa Nova', 'Samba', 'Pagode', 'Axé', 'Reggaeton',
];

// Sem lista canônica no backend (favoriteInstruments aceita string[] livre,
// só normaliza/trima e limita a 15) — mesmos rótulos usados no wizard do
// músico, por consistência de nomenclatura entre as duas personas.
export const INSTRUMENT_OPTIONS: string[] = [
  'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado / Piano', 'Voz',
  'Saxofone', 'Violino', 'Cajón', 'DJ / Controladora', 'Percussão', 'Sopros',
];

// Amenidades comuns de estabelecimento — sem enum no backend
// (Establishment.amenities aceita string[] livre); preset só pra montar os
// chips do FilterSheet (Bloco 11.4).
export const AMENITY_OPTIONS: string[] = [
  'Estacionamento', 'Área externa', 'Ar-condicionado', 'Palco', 'Wi-Fi',
  'Acessibilidade', 'Cardápio kids', 'Pet friendly',
];
