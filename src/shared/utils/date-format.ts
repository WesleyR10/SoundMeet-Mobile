// Formatação de data/hora em pt-BR reaproveitada por telas com preview de
// timestamp (chat, histórico de gorjetas, eventos) — evita reimplementar a
// mesma tabela de meses/formatação HH:MM em cada feature (achado em revisão:
// TipHistoryItem.tsx, EventListItem.tsx e a feature scheduling/ tinham cada
// uma sua própria cópia).
const MONTHS_PT_BR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_PT_BR[d.getMonth()]}`;
}

// Padrão de preview de lista (WhatsApp/iMessage): hora se for hoje, dia+mês
// caso contrário.
export function formatListPreviewTime(iso: string): string {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? formatHHMM(iso) : formatShortDate(iso);
}
