/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        brute: {
          black: '#0A0A0A',
          white: '#FAFAFA',
          blue: '#1B4FFF',
          'blue-dark': '#0A2ED6',
          'blue-light': '#4F7FFF',
          'blue-neon': '#00C2FF',
          yellow: '#FFE600',
          'yellow-dark': '#D4BF00',
          'yellow-light': '#FFF176',
          glass: 'rgba(255, 255, 255, 0.08)',
          'glass-border': 'rgba(255, 255, 255, 0.15)',
        }
      },
      boxShadow: {
        'brute': '5px 5px 0px #0A0A0A',
        'brute-lg': '8px 8px 0px #0A0A0A',
        'brute-blue': '5px 5px 0px #1B4FFF',
        'brute-yellow': '5px 5px 0px #FFE600',
        'brute-sm': '3px 3px 0px #0A0A0A',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glow-blue': '0 0 20px rgba(27, 79, 255, 0.5)',
        'glow-yellow': '0 0 20px rgba(255, 230, 0, 0.5)',
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        'gradient-main': 'linear-gradient(135deg, #060B1A 0%, #0D1B3E 50%, #060B1A 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      borderWidth: {
        '3': '3px',
      },
      keyframes: {
        'slot-spin': {
          '0%': { transform: 'translateY(0%)', opacity: '1' },
          '25%': { transform: 'translateY(-100%)', opacity: '0' },
          '26%': { transform: 'translateY(100%)', opacity: '0' },
          '75%': { transform: 'translateY(0%)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(27, 79, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(27, 79, 255, 0.8)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        }
      },
      animation: {
        'slot-spin': 'slot-spin 0.15s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      }
    },
  },
  plugins: [],
}
