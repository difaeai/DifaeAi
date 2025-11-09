import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './apps/**/*.{ts,tsx,js,jsx}',
    './packages/**/*.{ts,tsx,js,jsx}',
    './packages/**/*.{mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        accent: '#22D3EE',
        dark: '#0B1220'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 40px rgba(79, 70, 229, 0.45)'
      }
    }
  },
  plugins: []
};

export default config;
