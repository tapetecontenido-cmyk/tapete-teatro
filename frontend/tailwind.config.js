/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Colores de marca Tapete Teatro ──
        azul:   '#3333CC',
        cyan:   '#299FE3',
        // Variantes de azul
        'azul-dark':  '#2222AA',
        'azul-light': '#5555DD',
        'cyan-dark':  '#1B7FB5',
        'cyan-light': '#5BB8EC',
        // Neutros
        'gray-50':  '#F8F9FA',
        'gray-100': '#F1F3F5',
        'gray-200': '#E9ECEF',
        'gray-300': '#DEE2E6',
        'gray-400': '#CED4DA',
        'gray-500': '#ADB5BD',
        'gray-600': '#6C757D',
        'gray-700': '#495057',
        'gray-800': '#343A40',
        'gray-900': '#212529',
        // Estados de asientos
        seat: {
          vip:       '#F5C542',
          general:   '#299FE3',
          selected:  '#3333CC',
          occupied:  '#E53E3E',
          blocked:   '#CBD5E0',
        },
        // Estados de reservas
        status: {
          pending:   '#F6AD55',
          confirmed: '#68D391',
          cancelled: '#FC8181',
        }
      },
      fontFamily: {
        // Tipografías de marca (cargadas via @font-face en index.css)
        'display': ['Unpredictable', 'sans-serif'],
        'heading': ['"Bebas Neue"', 'sans-serif'],
        // Fuente de cuerpo segura y complementaria
        'body':    ['"Poppins"', 'sans-serif'],
        'mono':    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-xl': ['5rem',   { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem',{ lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-md': ['3rem',   { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-sm': ['2.25rem',{ lineHeight: '1.15' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'brand':    '0 4px 24px rgba(51, 51, 204, 0.15)',
        'brand-lg': '0 8px 48px rgba(51, 51, 204, 0.2)',
        'cyan':     '0 4px 24px rgba(41, 159, 227, 0.2)',
        'card':     '0 2px 16px rgba(0, 0, 0, 0.08)',
        'card-lg':  '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #3333CC 0%, #299FE3 100%)',
        'gradient-brand-v': 'linear-gradient(180deg, #3333CC 0%, #299FE3 100%)',
        'gradient-hero':    'linear-gradient(135deg, #3333CC 0%, #1B7FB5 50%, #299FE3 100%)',
        'gradient-subtle':  'linear-gradient(135deg, rgba(51,51,204,0.05) 0%, rgba(41,159,227,0.05) 100%)',
      },
      animation: {
        'fade-up':     'fadeUp 0.6s ease-out forwards',
        'fade-in':     'fadeIn 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.5s ease-out forwards',
        'float':       'float 3s ease-in-out infinite',
        'pulse-brand': 'pulseBrand 2s ease-in-out infinite',
        'count-up':    'countUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        pulseBrand: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(51, 51, 204, 0.3)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(51, 51, 204, 0)' },
        },
      },
      transitionTimingFunction: {
        'brand': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
