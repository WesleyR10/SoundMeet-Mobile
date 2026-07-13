import { stripDigits } from './cpf';

export function isValidPhoneBr(value: string): boolean {
  const digits = stripDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function formatPhoneBr(value: string): string {
  const digits = stripDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// PIX (chave tipo celular) exige E.164 — ex.: +5511999999999. O backend
// (PixKey VO) rejeita qualquer outro formato para pix_key_type "phone".
export function toE164Br(value: string): string {
  const digits = stripDigits(value);
  return `+55${digits}`;
}
