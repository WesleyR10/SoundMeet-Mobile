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
  bodyLg:    { fontFamily: 'Inter-Regular',          fontSize: 17, lineHeight: 26 },
  body:      { fontFamily: 'Inter-Regular',          fontSize: 15, lineHeight: 23 },
  bodySm:    { fontFamily: 'Inter-Regular',          fontSize: 13, lineHeight: 20 },
  caption:   { fontFamily: 'Inter-Medium',           fontSize: 11, lineHeight: 16 },
  mono:      { fontFamily: 'JetBrainsMono-Regular',  fontSize: 14, lineHeight: 22 },
} as const;

export const shadows = {
  sm:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.40, shadowRadius: 8,  elevation: 3 },
  md:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.50, shadowRadius: 16, elevation: 6 },
  lg:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.60, shadowRadius: 32, elevation: 12 },
  brand:  { shadowColor: '#00E0B8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 8 },
  coral:  { shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 8 },
  violet: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 24, elevation: 8 },
} as const;

export const lightColors = {
  bg: {
    primary:  '#F0FEFA',
    surface:  '#FFFFFF',
    elevated: '#E0FAF5',
  },
  brand: {
    primary: '#008F74',
    light:   '#00B896',
  },
  text: {
    primary:   '#081A17',
    secondary: '#2D5047',
  },
  border: {
    default: '#C0EDE5',
  },
} as const;
