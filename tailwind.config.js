/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Estado badges — must not be purged
    'bg-status-pending', 'text-status-pending', 'border-status-pending',
    'bg-status-negotiating', 'text-status-negotiating', 'border-status-negotiating',
    'bg-status-discarded', 'text-status-discarded', 'border-status-discarded',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          peach: '#E76F51',
          'peach-dark': '#C85A3D',
          teal: '#2A9D8F',
          'teal-dark': '#1E7A6E',
          dark: '#264653',
        },
        status: {
          pending: '#1D4ED8',
          'pending-light': '#DBEAFE',
          negotiating: '#B45309',
          'negotiating-light': '#FEF3C7',
          discarded: '#4B5563',
          'discarded-light': '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', maxHeight: '0', overflow: 'hidden' },
          '100%': { opacity: '1', maxHeight: '9999px' },
        },
        slideUp: {
          '0%': { opacity: '1', maxHeight: '9999px' },
          '100%': { opacity: '0', maxHeight: '0', overflow: 'hidden' },
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
