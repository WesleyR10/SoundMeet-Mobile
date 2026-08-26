import { stripDigits } from './cpf';

// Espelho de cpf.ts para o CNPJ do MEI. Validar no cliente evita a ida ao
// servidor só pra ouvir "dígito verificador errado" — mas quem decide continua
// sendo o VO `CNPJ` do backend, que revalida tudo.
export function isValidCnpj(value: string): boolean {
  const digits = stripDigits(value);

  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const numbers = digits.split('').map(Number);

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += numbers[i] * firstWeights[i];
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (firstDigit !== numbers[12]) return false;

  const secondWeights = [6, ...firstWeights];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += numbers[i] * secondWeights[i];
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return secondDigit === numbers[13];
}

export function formatCnpj(value: string): string {
  const digits = stripDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
