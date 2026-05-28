/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        sui: {
          black: '#0f0f0f',
          'off-black': '#262626',
          white: '#ffffff',
          'off-white': '#f9f9f9',
          light: '#f2f2f2',
          dark: '#969696',
          'warm-grey': '#d6d3c4',
          gold: '#fdda24',
          red: '#ff3f00',
          teal: '#00a7b5',
          lilac: '#b7ace8',
          navy: '#002e5d',
        },
      },
    },
  },
  plugins: [],
};
