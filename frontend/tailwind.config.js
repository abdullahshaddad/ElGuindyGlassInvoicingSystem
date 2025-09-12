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
                'sans': ['Tajawal', 'Cairo', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#e6f3fa',
                    100: '#cce7f5',
                    200: '#99cfeb',
                    300: '#66b7e1',
                    400: '#339fd7',
                    500: '#0077B6', // Glass Blue
                    600: '#006ba5',
                    700: '#005f94',
                    800: '#005383',
                    900: '#004772',
                },
                secondary: {
                    50: '#e8f5f3',
                    100: '#d1ebe7',
                    200: '#a3d7cf',
                    300: '#75c3b7',
                    400: '#47af9f',
                    500: '#3FA796', // Reflective Green
                    600: '#399687',
                    700: '#338578',
                    800: '#2d7469',
                    900: '#27635a',
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
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
            }
        },
    },
    plugins: [
        // RTL support
        function({ addUtilities }) {
            const newUtilities = {
                '.rtl': {
                    direction: 'rtl',
                },
                '.ltr': {
                    direction: 'ltr',
                },
            }
            addUtilities(newUtilities)
        }
    ],
}