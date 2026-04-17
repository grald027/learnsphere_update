
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',
        secondary: '#E8F4FD',
        accent: '#2C6FBF',
        dark: '#1A2B3C',
        gray: {
          DEFAULT: '#4A5568',
          light: '#718096'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
