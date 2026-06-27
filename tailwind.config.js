import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                // MGI Connect design system — primary blue (topbar / logo = brand-600).
                brand: {
                    50: '#eef6fd',
                    100: '#d4e9fa',
                    200: '#a9d2f4',
                    300: '#74b4ea',
                    400: '#3d90db',
                    500: '#1b72c4',
                    600: '#0e5aa6',
                    700: '#0c4a87',
                    800: '#0d3e6f',
                    900: '#0f355d',
                },
            },
            fontFamily: {
                sans: ['Segoe UI', 'system-ui', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                'loader-dots': {
                    '0%, 20%': { opacity: '0' },
                    '50%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(6px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'bar-slide': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.35s ease-out',
                'bar-slide': 'bar-slide 1.1s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
