/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bleu: '#1D4ED8',
        'bleu-dark': '#1E3A8A',
      },
    },
  },
  plugins: [],
}
