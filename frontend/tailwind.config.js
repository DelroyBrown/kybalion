/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Grounds, accent, and text scales resolve through CSS variables so
        // the whole app re-skins per colour mode (dark/light) and per book
        // (Kybalion gold vs Ethiopian Bible indigo) — see styles/index.css.
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
        },
        gold: {
          200: 'rgb(var(--gold-200) / <alpha-value>)',
          300: 'rgb(var(--gold-300) / <alpha-value>)',
          400: 'rgb(var(--gold-400) / <alpha-value>)',
          500: 'rgb(var(--gold-500) / <alpha-value>)',
          600: 'rgb(var(--gold-600) / <alpha-value>)',
          700: 'rgb(var(--gold-700) / <alpha-value>)',
        },
        parchment: {
          50: 'rgb(var(--parchment-50) / <alpha-value>)',
          100: 'rgb(var(--parchment-100) / <alpha-value>)',
          200: 'rgb(var(--parchment-200) / <alpha-value>)',
          300: 'rgb(var(--parchment-300) / <alpha-value>)',
          400: 'rgb(var(--parchment-400) / <alpha-value>)',
          500: 'rgb(var(--parchment-500) / <alpha-value>)',
          600: 'rgb(var(--parchment-600) / <alpha-value>)',
        },
        // Supporting accents (decorative, shared by both books/modes)
        bronze: { 400: '#a98763', 500: '#8c6f4e', 600: '#6f573c' },
        copper: { 400: '#b57f5f', 500: '#96654a', 600: '#754e39' },
        amber: { 300: '#dbb277', 400: '#c99a5b', 500: '#a97d44' },
        crimson: { 300: '#b56a6d', 400: '#96494f', 500: '#7a3a40', 600: '#5c2c31' },
        violet: { 300: '#a08fb3', 400: '#83718f', 500: '#6a5a76', 600: '#4f4358' },
        plum: { 400: '#7d5f76', 500: '#63495c', 600: '#4a3745' },
        sage: { 400: '#8a9478', 500: '#6f7a60' },
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
