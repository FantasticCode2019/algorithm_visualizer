/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        surface: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
        accent: {
          compare: '#f59e0b',
          swap: '#ef4444',
          sorted: '#22c55e',
          pivot: '#a855f7',
          pointer: '#06b6d4',
          found: '#22c55e',
          discarded: '#475569',
        },
      },
    },
  },
  plugins: [],
}