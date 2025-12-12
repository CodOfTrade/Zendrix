/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00d4aa',
        surface: '#111827',
        surfaceAlt: '#0f172a'
      }
    }
  },
  plugins: []
};
