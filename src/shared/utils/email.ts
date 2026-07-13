// Checagem leve no cliente — aproximada, não RFC-completa. O backend usa
// class-validator `@IsEmail()` como fonte de verdade; este regex só evita
// submissões obviamente inválidas antes do round-trip.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
