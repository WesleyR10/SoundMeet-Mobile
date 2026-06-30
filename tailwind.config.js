/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00E0B8',
          light:   '#33E8C6',
          dark:    '#00B896',
          muted:   'rgba(0,224,184,0.12)',
          glow:    'rgba(0,224,184,0.20)',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          deep:    '#FF2E7A',
        },
        amber:  '#F59E0B',
        violet: {
          DEFAULT: '#7C3AED',
          light:   '#A855F7',
        },
        // Backgrounds
        base:    '#0C0C14',
        surface: {
          DEFAULT:  '#0D1A18',
          elevated: '#102320',
        },
        // Texto
        ink: {
          DEFAULT: '#F8FAFC',
          subtle:  '#94A3B8',
          muted:   '#475569',
        },
        // Bordas
        line: {
          DEFAULT: '#0F2E28',
          strong:  '#1A4A3C',
          brand:   'rgba(0,224,184,0.30)',
        },
        // Status semânticos
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error:   '#EF4444',
          live:    '#00E0B8',
        },
      },
      fontFamily: {
        // Nomes batem exatamente com os registrados em useFonts / tokens.ts
        'grotesk':       ['SpaceGrotesk-Medium'],
        'grotesk-semi':  ['SpaceGrotesk-SemiBold'],
        'grotesk-bold':  ['SpaceGrotesk-Bold'],
        'inter':         ['Inter-Regular'],
        'inter-medium':  ['Inter-Medium'],
        'inter-semi':    ['Inter-SemiBold'],
        'mono':          ['JetBrainsMono-Regular'],
      },
      spacing: {
        xs:   4,
        sm:   8,
        md:   12,
        lg:   16,
        xl:   24,
        '2xl': 32,
        '3xl': 48,
      },
      borderRadius: {
        sm:   8,
        md:   12,
        lg:   16,
        xl:   24,
      },
    },
  },
  plugins: [],
};
