/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'discord': {
                    DEFAULT: '#5865F2',
                    'dark': '#4752C4',
                },
                'lime': {
                    'light': '#84cc16',
                    'DEFAULT': '#65a30d',
                    'dark': '#4d7c0f',
                },
                'dark': {
                    'lighter': '#1f2937',
                    'DEFAULT': '#111827',
                    'darker': '#0f172a',
                }
            },
            animation: {
                'gradient': 'gradient 8s linear infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center',
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center',
                    },
                },
            },
        },
    },
    plugins: [],
} 