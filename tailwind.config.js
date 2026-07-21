/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './app/**/*.{js,ts,tsx}',
    './global.css', // Include global.css
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit_400Regular'],
        'outfit-bold': ['Outfit_700Bold'],
      },
      spacing: {
        global: '24px',
      },
      colors: {
        // Light theme colors
        highlight: '#FF2056',
        brand: {
          primary: '#767676',
          'primary-foreground': '#FFFFFF',
          accent: '#FF4F31',
          foreground: '#F1F1F1',
          secondary: '#0F0F0F',
          'secondary-foreground': '#FFFFFF',
          destructive: '#DC2626',
          border: '#404040',
        },
        light: {
          primary: '#ffffff', // White
          secondary: '#F5F5F5', // Light gray
          text: '#000000', // Black
          subtext: '#64748B',
        },
        // Dark theme colors
        dark: {
          primary: '#0F0F0F', // Black
          secondary: '#262626',
          darker: '#000000',
          text: '#ffffff', // White
          subtext: '#A1A1A1',
        },
      },
    },
  },
  plugins: [],
};
