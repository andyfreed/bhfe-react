import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          // Rich navy as primary color
          primary: {
            DEFAULT: '#1E3A8A',
            light: '#2563EB',
            dark: '#1E3A8A',
          },
          // Warm accent color
          accent: {
            DEFAULT: '#E65C2E',
            light: '#F87171',
            dark: '#BE123C',
          },
          // Neutral grays
          neutral: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          },
          // Success colors
          success: {
            light: '#86EFAC',
            DEFAULT: '#22C55E',
            dark: '#15803D',
          },
        }
      }
    },
  },
  plugins: [],
};

export default config; 