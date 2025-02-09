/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
"./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warna-warna futuristik yang sedikit beda
        "neo-black": "#080808",
        "neo-dark": "#121212",
        "neo-purple": "#9B5DEE",
        "neo-pink": "#FF4BCD",
        "neo-green": "#00FFA6",
        "neo-grey": "#2C2C2C",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};