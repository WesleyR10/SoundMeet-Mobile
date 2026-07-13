// Espelha getQrContrastRatio/hasSufficientQrContrast do backend
// (shared/domain/value-objects/qr-code.vo.ts) — mesma fórmula (WCAG 2.x),
// reaproveitada aqui só como aviso instantâneo no preview do
// EditQRCodeSection, antes de bater no backend (que é quem de fato barra a
// combinação ruim). Sem import cruzado entre os dois repos — duplicar essa
// função pura de ~15 linhas é o mesmo precedente de cpf.ts/phone.ts (cada
// repo tem seus próprios validadores primitivos).
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function hexToRgb(hex: string): [number, number, number] {
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map((c) => c + c).join('');
  }
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

const MIN_QR_CONTRAST_RATIO = 2;

export function getQrContrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexToRgb(hexA));
  const luminanceB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function hasSufficientQrContrast(foreground: string, background: string): boolean {
  if (!HEX_COLOR_PATTERN.test(foreground) || !HEX_COLOR_PATTERN.test(background)) {
    return true; // formato inválido é responsabilidade do próprio input de hex
  }
  return getQrContrastRatio(foreground, background) >= MIN_QR_CONTRAST_RATIO;
}
