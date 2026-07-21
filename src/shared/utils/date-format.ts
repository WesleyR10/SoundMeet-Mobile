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

// Máscara progressiva de digitação DD/MM/AAAA (mesmo racional de formatCpf/
// formatPhone: só dígitos, separadores reinseridos).
export function maskBrDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

// DD/MM/AAAA → Date local à meia-noite, ou null se o formato/calendário for
// inválido (o rollover do Date aceitaria 31/02 como 02/03 — aqui não).
export function parseBrDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const day   = Number(match[1]);
  const month = Number(match[2]);
  const year  = Number(match[3]);
  const date  = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}
