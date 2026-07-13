import type { EstablishmentPriceRange } from './establishment.types';

// Espelha formatPriceRange (features/musician/domain/musician.constants.ts) —
// não importado de lá (FSD: nunca cruzar features), mesma lógica de formatação.
export function formatEstablishmentPriceRange(priceRange: EstablishmentPriceRange | null): string | null {
  if (!priceRange) return null;
  const suffix = priceRange.model === 'per_hour' ? '/hora' : '/evento';
  const fmt = (n: number) => `R$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  if (priceRange.min === priceRange.max) return `${fmt(priceRange.min)}${suffix}`;
  return `${fmt(priceRange.min)}–${fmt(priceRange.max)}${suffix}`;
}
