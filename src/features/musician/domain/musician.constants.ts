import type { LucideIcon } from 'lucide-react-native';
import { Guitar, Piano, Drum, MicVocal, Music2, Music3, Music4, Disc3 } from 'lucide-react-native';
import type { PriceRange } from './musician.types';

export interface TagOption {
  id:    string;
  label: string;
  icon:  LucideIcon;
}

// Sem lista canônica no backend (Musician.instruments aceita string[] livre) —
// definida aqui no mobile. Ícones dedicados quando existem no lucide, Music3/4
// como fallback genérico para instrumentos sem ícone próprio.
export const INSTRUMENT_OPTIONS: TagOption[] = [
  { id: 'violao',       label: 'Violão',            icon: Guitar },
  { id: 'guitarra',     label: 'Guitarra',          icon: Guitar },
  { id: 'baixo',        label: 'Baixo',             icon: Music2 },
  { id: 'bateria',      label: 'Bateria',           icon: Drum },
  { id: 'teclado',      label: 'Teclado / Piano',   icon: Piano },
  { id: 'voz',          label: 'Voz',               icon: MicVocal },
  { id: 'saxofone',     label: 'Saxofone',          icon: Music4 },
  { id: 'violino',      label: 'Violino',           icon: Music3 },
  { id: 'cajon',        label: 'Cajón',             icon: Drum },
  { id: 'dj',           label: 'DJ / Controladora', icon: Disc3 },
  { id: 'percussao',    label: 'Percussão',         icon: Drum },
  { id: 'sopros',       label: 'Sopros',            icon: Music4 },
];

// Valores em português alinhados com VALID_GENRES do backend
// (audience-preferences.vo.ts) — sem enforcement server-side em Musician.genres,
// mas mantém consistência de nomenclatura entre músico e público.
export const GENRE_OPTIONS: TagOption[] = [
  { id: 'rock',        label: 'Rock',        icon: Music2 },
  { id: 'pop',         label: 'Pop',         icon: Music2 },
  { id: 'jazz',        label: 'Jazz',        icon: Music3 },
  { id: 'blues',       label: 'Blues',       icon: Music3 },
  { id: 'mpb',         label: 'MPB',         icon: Music4 },
  { id: 'sertanejo',   label: 'Sertanejo',   icon: Guitar },
  { id: 'forro',       label: 'Forró',       icon: Drum },
  { id: 'bossa-nova',  label: 'Bossa Nova',  icon: Guitar },
  { id: 'samba',       label: 'Samba',       icon: Drum },
  { id: 'pagode',      label: 'Pagode',      icon: Guitar },
  { id: 'axe',         label: 'Axé',         icon: Drum },
  { id: 'reggaeton',   label: 'Reggaeton',   icon: Disc3 },
  { id: 'hip-hop',     label: 'Hip Hop',     icon: Disc3 },
  { id: 'funk',        label: 'Funk',        icon: Disc3 },
  { id: 'gospel',      label: 'Gospel',      icon: MicVocal },
  { id: 'instrumental', label: 'Instrumental', icon: Music4 },
];

// Backend aceita string[] livre (sem enum) — enviamos o label legível (ex.: "Forró"),
// não o id/slug interno usado só para seleção no client.
export function resolveLabels(ids: string[], options: TagOption[]): string[] {
  const byId = new Map(options.map((o) => [o.id, o.label]));
  return ids.map((id) => byId.get(id) ?? id);
}

// Inverso de resolveLabels — usado pelo EditProfileScreen (Bloco 2) para
// reconstruir a seleção de chips a partir dos labels já salvos no backend.
export function resolveIds(labels: string[], options: TagOption[]): string[] {
  const byLabel = new Map(options.map((o) => [o.label, o.id]));
  return labels.map((label) => byLabel.get(label) ?? label);
}

// Usado pelo ViewProfileScreen (Bloco 2) para exibir a faixa de preço salva
// pelo EditProfileScreen. `null` quando o músico não definiu preço.
export function formatPriceRange(priceRange: PriceRange | null): string | null {
  if (!priceRange) return null;
  const suffix = priceRange.model === 'per_hour' ? '/hora' : '/evento';
  const fmt = (n: number) => `R$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  if (priceRange.min === priceRange.max) return `${fmt(priceRange.min)}${suffix}`;
  return `${fmt(priceRange.min)}–${fmt(priceRange.max)}${suffix}`;
}
