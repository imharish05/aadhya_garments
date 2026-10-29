/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:    '#FAFAF8',
          text:  '#1A1A1A',
          gold:  '#C9A24B',
          white: '#FFFFFF',
          grey:  '#6B6B6B',
          light: '#F0EEE8',
        },
      },
      fontFamily: {
        sans: ['"Montserrat"', 'system-ui', '-apple-system', 'sans-serif'],
        montserrat: ['"Montserrat"', 'system-ui', '-apple-system', 'sans-serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        cinzel: ['"Cinzel"', 'Georgia', 'serif'],
        inter: ['"Montserrat"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: { site: '1440px' },
    },
  },
  plugins: [],
}
