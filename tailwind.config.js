/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand:   '#00E0B8',
        'brand-light': '#33E8C6',
        'brand-dark':  '#00B896',
        coral:   '#FF6B6B',
        amber:   '#F59E0B',
        violet:  '#7C3AED',
        bg:      '#0C0C14',
        surface: '#0D1A18',
      },
    },
  },
  plugins: [],
};
