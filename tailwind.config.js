/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      minHeight: { touch: '44px' },
      borderRadius: { card: '1rem', cardSm: '0.75rem' },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        ios: '0 8px 24px rgba(0,0,0,0.25)',
        glow: '0 0 0 2px rgba(255,255,255,0.3)',
      },
    },
  },
  plugins: [],
}
