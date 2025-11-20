/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#00E676', // Neon Green
        secondary: '#2979FF', // Bright Blue
        background: '#121212', // Dark Background
        surface: '#1E1E1E', // Slightly lighter dark
      },
    },
  },
  plugins: [],
}
