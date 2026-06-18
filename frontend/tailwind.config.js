/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090D16',
        darkCard: 'rgba(22, 29, 48, 0.7)',
        accentColor: '#10B981', // Emerald
        primaryColor: '#6366F1', // Indigo
        secondaryColor: '#8B5CF6', // Violet
        slateText: '#94A3B8',
        whiteText: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(99, 102, 241, 0.25)',
        'glow-accent': '0 0 15px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
