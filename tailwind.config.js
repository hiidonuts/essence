/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
      colors: {
        'dark': {
          50: '#f8f8f8',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#1a1a1a',
          900: '#0a0a0a',
        },
        'silver': {
          50: '#ffffff',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d3d3d3',
          400: '#b0b0b0',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
        }
      },
      backgroundColor: {
        'glass': 'rgba(25, 25, 25, 0.7)',
        'glass-dark': 'rgba(15, 15, 15, 0.8)',
      },
      borderColor: {
        'silver': 'rgba(200, 200, 200, 0.15)',
      },
      boxShadow: {
        'luxury': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        'luxury-lg': '0 12px 48px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.08)',
      },
      keyframes: {
        eyeBlink: {
          '0%': { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
          '49%': { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
          '50%': { clipPath: 'polygon(0% 50%, 100% 50%, 100% 50%, 0% 50%)' },
          '51%': { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
          '100%': { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }
        }
      },
      animation: {
        'eye-blink': 'eyeBlink 4s infinite'
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
