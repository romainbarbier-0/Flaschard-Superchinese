/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1c1a',
        paper: '#faf9f5',
        card: '#eeece5',
        accent: {
          DEFAULT: '#1e3a2b',
          light: '#2c5240',
        },
        muted: '#8a887f',
      },
      borderRadius: {
        xl2: '1.75rem',
      },
    },
  },
  plugins: [],
};
