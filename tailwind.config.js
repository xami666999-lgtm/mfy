/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mfy: {
          pink: '#FF1493',
          'pink-light': '#FF69B4',
          'pink-dark': '#C71585',
          cyan: '#00E5FF',
          'cyan-light': '#18FFFF',
          'cyan-dark': '#00B8D4',
          dark: {
            50: '#1a1a2e',
            100: '#16213e',
            200: '#0f1629',
            300: '#0a0e1a',
            400: '#050810',
            500: '#020308',
          },
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Figtree', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 10px rgba(255, 20, 147, 0.5), 0 0 30px rgba(255, 20, 147, 0.2)',
        'neon-cyan': '0 0 10px rgba(0, 229, 255, 0.5), 0 0 30px rgba(0, 229, 255, 0.2)',
      },
    },
  },
  plugins: [],
}
