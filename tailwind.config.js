/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "lexend-deca": ["Lexend Deca", "sans-serif"],
      },
      colors: {
        "charcoal-black": "#121212",
        "light-green": "#ACF39D",
        "orange-web": "#F9A620",
      },
    },
  },
  plugins: [],
};
