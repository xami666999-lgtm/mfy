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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 10px rgba(255, 20, 147, 0.5), 0 0 30px rgba(255, 20, 147, 0.2)',
        'neon-cyan': '0 0 10px rgba(0, 229, 255, 0.5), 0 0 30px rgba(0, 229, 255, 0.2)',
        'neon-pink-strong': '0 0 15px rgba(255, 20, 147, 0.7), 0 0 45px rgba(255, 20, 147, 0.3)',
        'neon-cyan-strong': '0 0 15px rgba(0, 229, 255, 0.7), 0 0 45px rgba(0, 229, 255, 0.3)',
      },
      animation: {
        'glow-pink': 'glow-pink 2s ease-in-out infinite alternate',
        'glow-cyan': 'glow-cyan 2s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'glow-pink': {
          '0%': { boxShadow: '0 0 5px rgba(255, 20, 147, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 20, 147, 0.6), 0 0 40px rgba(255, 20, 147, 0.2)' },
        },
        'glow-cyan': {
          '0%': { boxShadow: '0 0 5px rgba(0, 229, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.6), 0 0 40px rgba(0, 229, 255, 0.2)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
