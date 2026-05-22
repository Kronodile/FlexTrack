/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'swiss-bg': '#FFFFFF',
        'swiss-fg': '#000000',
        'swiss-muted': '#F2F2F2',
        'swiss-accent': '#FF3000',
      },
      borderWidth: {
        '3': 3,
        '4': 4,
      },
      letterSpacing: {
        tighter: -1,
        widest: 3,
      },
      fontFamily: {
        inter: ['Inter_400Regular', 'sans-serif'],
        'inter-medium': ['Inter_500Medium', 'sans-serif'],
        'inter-bold': ['Inter_700Bold', 'sans-serif'],
        'inter-black': ['Inter_900Black', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
