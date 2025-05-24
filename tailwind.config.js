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
                    DEFAULT: 'oklch(55.4% 0.2 265.1)',
                    'dark': 'oklch(48.2% 0.2 265.1)',
                },
                'lime': {
                    'light': 'oklch(79.2% 0.209 151.711)',
                    'DEFAULT': 'oklch(72.3% 0.219 149.579)',
                    'dark': 'oklch(65.4% 0.229 147.447)',
                },
                'dark': {
                    'lighter': 'oklch(37.3% 0.034 259.733)',
                    'DEFAULT': 'oklch(27.8% 0.033 256.848)',
                    'darker': 'oklch(21% 0.034 264.665)',
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