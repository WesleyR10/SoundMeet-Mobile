export function stripDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(value: string): boolean {
  const digits = stripDigits(value);

  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const numbers = digits.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += numbers[i] * (10 - i);
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (firstDigit !== numbers[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += numbers[i] * (11 - i);
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return secondDigit === numbers[10];
}

export function formatCpf(value: string): string {
  const digits = stripDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
