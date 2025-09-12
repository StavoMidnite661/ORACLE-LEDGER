/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sov-dark': '#0B0F1A',
        'sov-dark-alt': '#1A1F2E',
        'sov-accent': '#00D4FF',
        'sov-accent-hover': '#00B8E6',
        'sov-light': '#F0F4F8',
        'sov-light-alt': '#B8C5D1',
        'sov-gold': '#FFD700',
        'sov-green': '#00FF88',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}