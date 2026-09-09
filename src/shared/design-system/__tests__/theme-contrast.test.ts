import { colors, lightColors } from '../tokens';

/**
 * Contraste WCAG das duas paletas.
 *
 * ## Por que existe
 *
 * O `design-system.md` anuncia *"Light mode existe como toggle"* desde
 * jun/2026, e a paleta clara **nunca tinha sido medida**. Ao medir (05/set/2026)
 * três falhas apareceram, e uma delas explica sozinha por que o tema nunca foi
 * ligado: `brand.primary` dava **3.87** para texto branco em cima — o rótulo do
 * **botão primário** reprovava AA. As bordas davam 1.23 e 1.54 contra os 3.0
 * que o critério 1.4.11 exige de componente de interface: campo de formulário
 * cuja borda o usuário não enxerga.
 *
 * ⚠️ Espelha `soundmeet-web/src/shared/config/__tests__/theme-contrast.spec.ts`.
 * As duas paletas são a mesma decisão de design em dois runtimes — **mexeu numa,
 * mexa na outra e rode os dois testes.**
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_TEXT = 4.5;
/** WCAG 1.4.11 — componente de interface não-textual. */
const AA_NON_TEXT = 3.0;

type Palette = typeof colors | typeof lightColors;

function surfaces(p: Palette): string[] {
  return [p.bg.primary, p.bg.surface, p.bg.elevated];
}

/** Cores usadas como TEXTO em tamanho normal. */
function textTokens(p: Palette): Record<string, string> {
  return {
    'text.primary': p.text.primary,
    'text.secondary': p.text.secondary,
    'text.muted': p.text.muted,
    'text.brand': p.text.brand,
    'brand.primary': p.brand.primary,
    'accent.coral': p.accent.coral,
    'accent.coralDeep': p.accent.coralDeep,
    'accent.amber': p.accent.amber,
    'accent.violet': p.accent.violet,
    'accent.violetLight': p.accent.violetLight,
    'status.success': p.status.success,
    'status.warning': p.status.warning,
    'status.error': p.status.error,
  };
}

/** Superfícies sólidas que recebem `text.inverse` por cima (botões). */
function solidTokens(p: Palette): Record<string, string> {
  return {
    'brand.primary': p.brand.primary,
    'accent.coral': p.accent.coral,
    'accent.violet': p.accent.violet,
    'status.success': p.status.success,
    'status.error': p.status.error,
    'accent.amber': p.accent.amber,
  };
}

/**
 * 🔴 **Reprovações CONHECIDAS do tema escuro — que está em produção.**
 *
 * Descobertas em 05/set/2026, ao escrever este teste. Não são corrigidas aqui
 * de propósito: `accent.violet` é **cor de marca** (`design-system.md`,
 * "momentos premium") e `text.muted` pinta caption/timestamp em mais de cem
 * lugares — mudar qualquer um dos dois é decisão de design com impacto visual
 * amplo, não conserto mecânico que um agente faz de passagem.
 *
 * A lista existe para que elas fiquem **visíveis e contadas** em vez de
 * invisíveis, e para que **não cresçam**: a asserção compara com o conjunto
 * exato. Uma cor nova que reprove falha o teste; uma reprovação corrigida
 * também falha, obrigando a apagar a linha daqui.
 *
 * ⚠️ Isto NÃO se aplica ao tema claro, que é medido sem exceção — ele ainda
 * não foi ao ar, e liberar um tema já sabendo que reprova seria escolher a
 * dívida em vez de herdá-la.
 *
 * Para atacar (cada linha é um item de trabalho de design):
 *  - `text.muted` (2.16–2.57) — o pior, e o mais usado. Precisa clarear;
 *  - `accent.violet` (2.87–3.42) — reprova como texto E como fundo de botão;
 *  - `accent.violetLight` e `status.error` sobre `bg.elevated` — marginais;
 *  - `border.strong` (1.63–1.94) — abaixo do 1.4.11 para borda de campo.
 */
const KNOWN_DARK_FAILURES = [
  'text.muted (#475569) sobre #0C0C14: 2.57',
  'text.muted (#475569) sobre #0D1A18: 2.35',
  'text.muted (#475569) sobre #102320: 2.16',
  'accent.violet (#7C3AED) sobre #0C0C14: 3.42',
  'accent.violet (#7C3AED) sobre #0D1A18: 3.13',
  'accent.violet (#7C3AED) sobre #102320: 2.87',
  'accent.violetLight (#A855F7) sobre #102320: 4.14',
  'status.error (#EF4444) sobre #102320: 4.35',
];

const KNOWN_DARK_SOLID_FAILURES = ['text.inverse sobre accent.violet (#7C3AED): 3.42'];

const KNOWN_DARK_NON_TEXT_FAILURES = [
  'border.strong sobre #0C0C14: 1.94',
  'border.strong sobre #0D1A18: 1.77',
  'border.strong sobre #102320: 1.63',
];

describe.each([
  ['tema claro', lightColors as Palette, [] as string[], [] as string[], [] as string[]],
  ['tema escuro', colors as Palette, KNOWN_DARK_FAILURES, KNOWN_DARK_SOLID_FAILURES, KNOWN_DARK_NON_TEXT_FAILURES],
])('%s', (_label, palette, knownText, knownSolid, knownNonText) => {
  it('todo token de texto passa AA sobre as três superfícies', () => {
    const failures: string[] = [];

    for (const [name, fg] of Object.entries(textTokens(palette))) {
      for (const bg of surfaces(palette)) {
        const value = contrast(fg, bg);
        if (value < AA_TEXT) failures.push(`${name} (${fg}) sobre ${bg}: ${value.toFixed(2)}`);
      }
    }

    // Uma asserção com a lista completa, e não `it.each`: quando uma cor muda,
    // o interessante é ver TODAS as combinações que ela quebrou de uma vez.
    expect(failures).toEqual(knownText);
  });

  /*
   * 🔴 O teste que a paleta original reprovava: 3.87 no botão primário, que é o
   * elemento mais tocado do app inteiro.
   */
  it('o rótulo em text.inverse passa AA sobre cada superfície sólida', () => {
    const failures: string[] = [];

    for (const [name, solid] of Object.entries(solidTokens(palette))) {
      const value = contrast(palette.text.inverse, solid);
      if (value < AA_TEXT) failures.push(`text.inverse sobre ${name} (${solid}): ${value.toFixed(2)}`);
    }

    expect(failures).toEqual(knownSolid);
  });

  /*
   * 🔴 `border.strong` é a borda de campo de formulário. Abaixo de 3.0 o
   * usuário não enxerga onde o campo começa — e no tema claro original ela
   * dava 1.54.
   */
  it('border.strong e o anel de foco passam o critério 1.4.11', () => {
    const failures: string[] = [];

    for (const bg of surfaces(palette)) {
      const border = contrast(palette.border.strong, bg);
      if (border < AA_NON_TEXT) failures.push(`border.strong sobre ${bg}: ${border.toFixed(2)}`);

      const ring = contrast(palette.brand.primary, bg);
      if (ring < AA_NON_TEXT) failures.push(`brand.primary (foco) sobre ${bg}: ${ring.toFixed(2)}`);
    }

    expect(failures).toEqual(knownNonText);
  });
});
