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
        /** Body & UI copy — Archivo Regular */
        sans: ['Archivo_400Regular'],
        archivo: ['Archivo_400Regular'],
        /** Long-form body copy — Archivo Light (manual p.17) */
        'archivo-light': ['Archivo_300Light'],
        /** Headings — Archivo Bold */
        'archivo-bold': ['Archivo_700Bold'],
      },
      fontSize: {
        /** Mobile scale derived from brand manual (72–92 print → display) */
        display: ['36px', { lineHeight: '38px' }],
        h1: ['28px', { lineHeight: '30px' }],
        h2: ['24px', { lineHeight: '26px' }],
        h3: ['20px', { lineHeight: '22px' }],
        h4: ['18px', { lineHeight: '20px' }],
        subtitle: ['16px', { lineHeight: '19px' }],
        body: ['15px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '22px' }],
        caption: ['12px', { lineHeight: '18px' }],
      },
      lineHeight: {
        display: '38px',
        h1: '30px',
        h2: '26px',
        h3: '22px',
        h4: '20px',
        subtitle: '19px',
        body: '24px',
        'body-sm': '22px',
        'body-light': '25px',
        caption: '18px',
      },
      spacing: {
        /** Screen gutter — ThemeScroller, Header, px-global, p-global, pt-global */
        global: '24px',
        /** Card / panel inner padding (prefer over p-4) */
        card: '16px',
        /** Tight gaps between related elements */
        tight: '8px',
        /** Default vertical stack between blocks */
        stack: '12px',
        /** Section top/bottom spacing */
        section: '24px',
      },
      colors: {
        // Light theme colors
        /** Compile-time fallback only — runtime accent via useThemeColors().highlight */
        highlight: '#FF2056',
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
