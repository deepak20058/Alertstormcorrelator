/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#080c14',
          navy: '#0b1329',
          card: '#0f172a',
          cardBorder: '#1e293b',
          blue: '#3b82f6',
          electric: '#00d2ff',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          violet: '#a855f7',
          pink: '#ec4899',
          amber: '#f59e0b',
          red: '#ef4444',
          emerald: '#10b981',
          green: '#22c55e',
          accent: '#14b8a6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.35)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.35)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}
