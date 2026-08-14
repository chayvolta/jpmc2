/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Base dark palette
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          900: '#0f1117',
          800: '#141720',
          700: '#1a1f2e',
          600: '#222840',
          500: '#2d3452',
        },
        // Blue accent
        ocean: {
          50: '#e8f4fd',
          100: '#cfe8f7',
          200: '#9dd1f0',
          300: '#6baed6',
          400: '#4292c6',
          500: '#2171b5',
          600: '#1a5fa0',
          700: '#134d8b',
          800: '#0c3b76',
          900: '#062961',
        },
        // Conflict warning colors
        conflict: {
          low: '#cfe8f7',
          medium: '#6baed6',
          high: '#2171b5',
          vhigh: '#f59e0b',
          critical: '#ef4444',
          extreme: '#991b1b',
        },
        // Accent
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          900: '#991b1b',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #0f1117 0%, #141720 50%, #1a1f2e 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(33, 113, 181, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'countUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
