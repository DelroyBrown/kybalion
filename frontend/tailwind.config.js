/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Grounds — warm near-blacks and graphites
        ink: {
          950: '#0a0908',
          900: '#100e0c',
          850: '#151310',
          800: '#1a1714',
          700: '#231f1a',
          600: '#2e2921',
          500: '#3b3529',
        },
        // Tarnished gold — the primary accent, aged not shiny
        gold: {
          200: '#e5cf9c',
          300: '#d3b878',
          400: '#bfa05d',
          500: '#a3874a',
          600: '#836c3c',
          700: '#63512e',
        },
        // Supporting accents
        bronze: { 400: '#a98763', 500: '#8c6f4e', 600: '#6f573c' },
        copper: { 400: '#b57f5f', 500: '#96654a', 600: '#754e39' },
        amber: { 300: '#dbb277', 400: '#c99a5b', 500: '#a97d44' },
        crimson: { 300: '#b56a6d', 400: '#96494f', 500: '#7a3a40', 600: '#5c2c31' },
        violet: { 300: '#a08fb3', 400: '#83718f', 500: '#6a5a76', 600: '#4f4358' },
        plum: { 400: '#7d5f76', 500: '#63495c', 600: '#4a3745' },
        sage: { 400: '#8a9478', 500: '#6f7a60' },
        // Text — aged paper tones
        parchment: {
          50: '#f4ecdd',
          100: '#ece2ce',
          200: '#ddd0b6',
          300: '#c3b596',
          400: '#a2957a',
          500: '#837863',
          600: '#655d4e',
        },
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', '"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        widecaps: '0.22em',
        caps: '0.14em',
      },
      maxWidth: {
        reader: '42rem',
        'reader-narrow': '34rem',
        'reader-wide': '52rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out both',
        'drift': 'drift 24s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        drift: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
