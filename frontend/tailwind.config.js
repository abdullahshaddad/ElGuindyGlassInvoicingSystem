/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'tajawal': ['Tajawal', 'sans-serif'],
        'cairo': ['Cairo', 'sans-serif'],
        'sans': ['Tajawal', 'Cairo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        secondary: {
          50:  'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
        },
        accent: {
          50: '#f2ede6',
          100: '#e5dbcd',
          200: '#cbb79b',
          300: '#b19369',
          400: '#976f37',
          500: '#A97142', // Bronze Brown
          600: '#98663b',
          700: '#875b34',
          800: '#76502d',
          900: '#654526',
        },
        accent2: {
          50: '#e6e6e6',
          100: '#cccccc',
          200: '#999999',
          300: '#666666',
          400: '#333333',
          500: '#1C1C1C', // Deep Black
          600: '#191919',
          700: '#161616',
          800: '#131313',
          900: '#101010',
        },
        neutral: {
          50: '#F5F5F5', // Frosted White
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#d0d0d0',
          400: '#c0c0c0',
          500: '#B0B0B0', // Silver Gray
          600: '#9e9e9e',
          700: '#8c8c8c',
          800: '#7a7a7a',
          900: '#686868',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      // Add backdrop blur utilities
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      // Add backdrop brightness
      backdropBrightness: {
        0: '0',
        50: '.5',
        75: '.75',
        90: '.9',
        95: '.95',
        100: '1',
        105: '1.05',
        110: '1.1',
        125: '1.25',
        150: '1.5',
        200: '2',
      },
      // Add backdrop saturate
      backdropSaturate: {
        0: '0',
        50: '.5',
        100: '1',
        150: '1.5',
        200: '2',
      },
      // Add more box shadow options
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)',
        'glow': '0 0 20px rgb(var(--color-primary-500) / 0.3)',
        'glow-lg': '0 0 40px rgb(var(--color-primary-500) / 0.4)',
        'inner-border': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      // Add gradient color stops
      gradientColorStops: {
        'primary-light': 'rgb(var(--color-primary-50))',
        'primary-dark': 'rgb(var(--color-primary-900))',
        'secondary-light': 'rgb(var(--color-secondary-50))',
        'secondary-dark': 'rgb(var(--color-secondary-900))',
        'accent-light': '#f2ede6',
        'accent-dark': '#654526',
      },
      // Add animation keyframes
      keyframes: {
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        'slide-in-right': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        'slide-in-left': {
          '0%': {
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          },
        },
        'bounce-in': {
          '0%': {
            transform: 'scale(0.3)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.8'
          },
          '70%': {
            transform: 'scale(0.9)',
            opacity: '0.9'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgb(var(--color-primary-500) / 0.3)'
          },
          '50%': {
            boxShadow: '0 0 40px rgb(var(--color-primary-500) / 0.6)'
          },
        },
        'blob': {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)'
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)'
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)'
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)'
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)'
          },
          '50%': {
            transform: 'translateY(-20px)'
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-468px 0'
          },
          '100%': {
            backgroundPosition: '468px 0'
          }
        }
      },
      // Add animation classes
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
        'fade-in-slow': 'fade-in 1s ease-in-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
        'blob': 'blob 7s infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      // Add animation delays
      animationDelay: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
        '5000': '5000ms',
      },
      // Add transform utilities
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      // Add transition timing functions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [
    // Add plugin for backdrop filters (if not already included)
    function({ addUtilities, theme, variants }) {
      const backdropUtilities = {
        '.backdrop-blur-xs': {
          'backdrop-filter': 'blur(2px)',
        },
        '.backdrop-blur-sm': {
          'backdrop-filter': 'blur(4px)',
        },
        '.backdrop-blur': {
          'backdrop-filter': 'blur(8px)',
        },
        '.backdrop-blur-md': {
          'backdrop-filter': 'blur(12px)',
        },
        '.backdrop-blur-lg': {
          'backdrop-filter': 'blur(16px)',
        },
        '.backdrop-blur-xl': {
          'backdrop-filter': 'blur(24px)',
        },
        '.backdrop-blur-2xl': {
          'backdrop-filter': 'blur(40px)',
        },
        '.backdrop-blur-3xl': {
          'backdrop-filter': 'blur(64px)',
        },
      }

      addUtilities(backdropUtilities, ['responsive'])
    },
    // Add glassmorphism utilities
    function({ addComponents, theme }) {
      addComponents({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        '.glass-dark': {
          background: 'rgba(17, 25, 40, 0.25)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.125)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        '.glass-card': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
      })
    },
    // Add RTL support utilities
    function({ addUtilities }) {
      const rtlUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        '.rtl .text-left': {
          textAlign: 'right',
        },
        '.rtl .text-right': {
          textAlign: 'left',
        },
        '.rtl .float-left': {
          float: 'right',
        },
        '.rtl .float-right': {
          float: 'left',
        },
        '.rtl .ml-auto': {
          marginRight: 'auto',
          marginLeft: 'initial',
        },
        '.rtl .mr-auto': {
          marginLeft: 'auto',
          marginRight: 'initial',
        },
      }
      addUtilities(rtlUtilities, ['responsive', 'hover'])
    }
  ],
}