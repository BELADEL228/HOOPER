import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
      },
      fontWeight: {
        'black': '900',
        'bold': '700',
        'semibold': '600',
      },
      animation: {
        blob: 'blob 7s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        glow: {
          '0%, 100%': {
            opacity: '0.5',
            boxShadow: '0 0 20px rgba(255, 107, 0, 0.4)',
          },
          '50%': {
            opacity: '1',
            boxShadow: '0 0 40px rgba(255, 107, 0, 0.8)',
          },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      backdropBlur: {
        xs: '2px',
      },
      perspective: {
        none: 'none',
        sm: '600px',
        default: '1000px',
        md: '1200px',
        lg: '1500px',
        xl: '2000px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        '.animate-blob': {
          animationName: 'blob',
          animationDuration: '7s',
          animationIterationCount: 'infinite',
        },
        '.animation-delay-2000': {
          animationDelay: '2s',
        },
        '.animation-delay-4000': {
          animationDelay: '4s',
        },
        '.perspective': {
          perspective: '1000px',
        },
        '.perspective-1200': {
          perspective: '1200px',
        },
        '.transform-gpu': {
          transform: 'translate3d(0, 0, 0)',
        },
        '.will-change-transform': {
          willChange: 'transform',
        },
      });
    },
  ],
};

export default config;