export const colors = {
  bg: {
    primary:  '#0C0C14',
    surface:  '#0D1A18',
    elevated: '#102320',
    overlay:  'rgba(0,0,0,0.72)',
  },
  brand: {
    primary: '#00E0B8',
    light:   '#33E8C6',
    dark:    '#00B896',
    muted:   'rgba(0,224,184,0.12)',
    glow:    'rgba(0,224,184,0.20)',
  },
  accent: {
    coral:       '#FF6B6B',
    coralDeep:   '#FF2E7A',
    amber:       '#F59E0B',
    violet:      '#7C3AED',
    violetLight: '#A855F7',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    live:    '#00E0B8',
  },
  text: {
    primary:   '#F8FAFC',
    secondary: '#94A3B8',
    muted:     '#475569',
    inverse:   '#0C0C14',
    brand:     '#00E0B8',
  },
  border: {
    default: '#0F2E28',
    strong:  '#1A4A3C',
    brand:   'rgba(0,224,184,0.30)',
  },
} as const;

export const gradients = {
  brand:   ['#00E0B8', '#00B896']   as const,
  energy:  ['#FF6B6B', '#FF2E7A']   as const,
  premium: ['#7C3AED', '#4D9CFF']   as const,
  warm:    ['#F59E0B', '#FF6B6B']   as const,
  dark:    ['#0C0C14', '#0D1A18']   as const,
  live:    ['rgba(0,224,184,0)', '#00E0B8'] as const,
} as const;

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const typography = {
  displayXl: { fontFamily: 'SpaceGrotesk-Bold',     fontSize: 48, lineHeight: 56 },
  displayLg: { fontFamily: 'SpaceGrotesk-Bold',     fontSize: 36, lineHeight: 44 },
  displayMd: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 28, lineHeight: 36 },
  title:     { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 22, lineHeight: 30 },
  // 18px — mínimo exigido pra telas de performance ao vivo (CLAUDE.md), legível
  // a 1 metro de distância num bar escuro. Nenhum token de body existente cobre
  // esse mínimo (bodyLg é 17px) — usado em LiveDashboardScreen/RequestCard.
  liveBody:  { fontFamily: 'Inter-Regular',          fontSize: 18, lineHeight: 27 },
  bodyLg:    { fontFamily: 'Inter-Regular',          fontSize: 17, lineHeight: 26 },
  body:      { fontFamily: 'Inter-Regular',          fontSize: 15, lineHeight: 23 },
  bodySm:    { fontFamily: 'Inter-Regular',          fontSize: 13, lineHeight: 20 },
  caption:   { fontFamily: 'Inter-Medium',           fontSize: 11, lineHeight: 16 },
  mono:      { fontFamily: 'JetBrainsMono-Regular',  fontSize: 14, lineHeight: 22 },
  // Acorde no Play Mode (Bloco 7) — precisa liderar visualmente sobre
  // liveBody (18px), já que o acorde é o sinal principal "o que tocar
  // agora" na tela de palco, não a letra. `mono` (14px) é menor que
  // liveBody e ficaria subordinado; peso Bold + 19px resolve isso.
  chordLive: { fontFamily: 'JetBrainsMono-Bold',     fontSize: 19, lineHeight: 24 },
} as const;

export const shadows = {
  sm:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.40, shadowRadius: 8,  elevation: 3 },
  md:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.50, shadowRadius: 16, elevation: 6 },
  lg:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.60, shadowRadius: 32, elevation: 12 },
  brand:  { shadowColor: '#00E0B8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 8 },
  coral:  { shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 8 },
  violet: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 24, elevation: 8 },
} as const;

/**
 * Paleta do tema claro.
 *
 * ## 🔴 Medida contra WCAG em 05/set/2026 — e a versão anterior REPROVAVA
 *
 * Estes valores existiam desde 27/jun/2026 e nunca tinham sido medidos. Ao
 * medir (o mesmo verificador que roda em `soundmeet-web`, em
 * `src/shared/config/__tests__/theme-contrast.spec.ts`), três falhas:
 *
 *  - `brand.primary` dava **3.87** para texto branco em cima — ou seja, o
 *    rótulo do **botão primário** reprovava AA (4.5). E dava **3.91** como cor
 *    de texto sobre o fundo, reprovando também para link;
 *  - `border.default` (1.23) e `border.strong` (1.54) ficavam muito abaixo dos
 *    **3.0** que o critério 1.4.11 exige de componente de interface: na
 *    prática, campo de formulário cuja borda o usuário não enxerga;
 *  - `text.muted` reprovava sobre `bg.elevated` (4.34).
 *
 * As cores foram escurecidas preservando o matiz (HLS) até o menor valor que
 * passa nos TRÊS fundos. Como todos eles estão perto do branco, escurecer o
 * suficiente para o texto passar faz o branco EM CIMA passar junto — não há
 * trade-off, só um piso.
 *
 * ## Completa de propósito
 *
 * A versão anterior tinha **8 chaves** e o `ThemeContext` inventava o resto em
 * runtime (`dark: '#007A63'`, `muted: '#64748B'`…), com valores que não
 * existiam em doc nenhum e que ninguém media. Agora a paleta nasce inteira
 * aqui, espelhando `soundmeet-web/src/app/globals.css` —
 * ⚠️ **mexeu num, mexa no outro, e meça de novo.**
 */
export const lightColors = {
  bg: {
    primary:  '#F0FEFA',
    surface:  '#FFFFFF',
    elevated: '#E0FAF5',
    overlay:  'rgba(0,0,0,0.50)',
  },
  brand: {
    primary: '#007D66', // 3.91 -> 4.91 como texto; 3.87 -> 4.87 no botão
    light:   '#00B896',
    dark:    '#00614A',
    muted:   'rgba(0,125,102,0.12)',
    glow:    'rgba(0,125,102,0.15)',
  },
  accent: {
    coral:       '#DB1F25', // 3.78 -> 4.78
    coralDeep:   '#D4206A',
    amber:       '#B45309',
    violet:      '#6D28D9', // branco em cima dava 3.42
    violetLight: '#7E22CE',
  },
  status: {
    success: '#048059', // 3.64 -> 4.78
    warning: '#B45309',
    error:   '#DA2323',
    live:    '#007D66',
  },
  text: {
    primary:   '#081A17',
    secondary: '#2D5047',
    muted:     '#61736D', // 4.34 sobre elevated -> 4.58
    inverse:   '#F8FAFC',
    brand:     '#007D66',
  },
  border: {
    default: '#86D5C5', // separador: 1.23 -> 1.64 (decorativo, fora do 1.4.11)
    strong:  '#309D8B', // 🔴 borda de campo: 1.54 -> 3.03, o piso do 1.4.11
    brand:   'rgba(0,125,102,0.30)',
  },
} as const;
