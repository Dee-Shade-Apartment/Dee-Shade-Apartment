/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f5f3',
          100: '#e9e7e2',
          200: '#d4d0c7',
          300: '#b5ae9f',
          400: '#948b78',
          500: '#7a7060',
          600: '#635b4e',
          700: '#504a40',
          800: '#3e3933',
          900: '#2a2722',
          950: '#1a1815',
        },
        gold: {
          50: '#fbf8f0',
          100: '#f5ecd7',
          200: '#ebd7ad',
          300: '#dcbb7a',
          400: '#cda04f',
          500: '#bf8a36',
          600: '#a6712c',
          700: '#855527',
          800: '#6e4526',
          900: '#5d3a24',
        },
        sage: {
          50: '#f4f6f4',
          100: '#e4ebe4',
          200: '#cad8ca',
          300: '#a3bda3',
          400: '#769b76',
          500: '#577f57',
          600: '#446645',
          700: '#375238',
          800: '#2d432f',
          900: '#253827',
        },
        cream: {
          50: '#fdfcf9',
          100: '#faf7f0',
          200: '#f4eee0',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
