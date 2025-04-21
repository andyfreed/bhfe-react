/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          // Modern indigo as primary color
          primary: {
            DEFAULT: '#4F46E5',
            light: '#818CF8',
            dark: '#3730A3',
          },
          // Vibrant coral accent
          accent: {
            DEFAULT: '#F43F5E',
            light: '#FB7185',
            dark: '#BE123C',
          },
          // Warm gray neutrals
          neutral: {
            50: '#FAFAF9',
            100: '#F5F5F4',
            200: '#E7E5E4',
            300: '#D6D3D1',
            400: '#A8A29E',
            500: '#78716C',
            600: '#57534E',
            700: '#44403C',
            800: '#292524',
            900: '#1C1917',
          },
          // Success colors
          success: {
            light: '#34D399',
            DEFAULT: '#10B981',
            dark: '#059669',
          },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}; 