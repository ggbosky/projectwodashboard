/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#09090B', 900: '#111114', 800: '#17171B', 700: '#1F1F25' },
        brand: { DEFAULT: 'rgb(var(--brand) / <alpha-value>)', soft: 'rgb(var(--brand-soft) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight Variable"', '"Inter Tight"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
