import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx}', // if code is in src/
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      screens: {
        tablet: '768px',
        desktop: '1024px',

        sm: '640px', //large mobile
        md: '768px', //tablet
        lg: '1024px', //laptop
        xl: '1280px', //desktop
      },
      colors: {
        primary: {
          black: '#1A1A1A',
          blue: '#1346AC',
          red: '#D63B29',
          green: '#246234',
        },
        neutral: {
          '10': '#0D140F',
          '30': '#515351',
          '40': '#7D817D',
          '60': '#CCCECC',
        },
        green: {
          '10': '#163C20',
          '90': '#F0FAF3',
        },
        khaki: {
          '60': '#DADA9F',
          '70': '#E7E7C0',
          '80': '#EFEFD6',
          '90': '#F6F6EC',
          '99': '#F9F9F6',
        },
        red: {
          '90': '#FBE8E2',
        },
        brown: {
          '10': '#FEF3CD',
          '90': '#644E02',
        },
        blue: {
          '10': '#CEEEFD',
          '90': '#044462',
        },
      },
      keyframes: {
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'zoom-in': 'zoom-in 0.6s ease-out',
      },
    },
  },
} satisfies Config
