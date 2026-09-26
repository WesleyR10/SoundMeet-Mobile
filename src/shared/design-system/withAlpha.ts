/**
 * Aplica transparência a uma cor `#RRGGBB` do tema e devolve `rgba(...)`.
 *
 * ## Por que existe
 *
 * O app escrevia véus de superfície como `'rgba(255,255,255,0.03)'` — branco
 * com pouca opacidade, que no fundo escuro dá um cartão levemente mais claro.
 * No tema claro o mesmo branco some sobre `#F0FEFA`: trilhos de progresso,
 * bolinhas de paginação e indicadores de força de senha ficavam invisíveis.
 *
 * `withAlpha(colors.text.primary, 0.03)` é o mesmo véu "da cor do texto": no
 * escuro `text.primary` é `#F8FAFC` (a diferença para o branco puro, a 3–8% de
 * opacidade, não chega a um nível de cor) e no claro é a tinta `#081A17`, que
 * escurece o fundo em vez de desaparecer nele.
 */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`withAlpha espera #RRGGBB, recebeu "${hex}"`);
  const n = parseInt(match[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
