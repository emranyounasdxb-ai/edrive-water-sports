import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7FBFC',
        foreground: '#082532',
        card: '#FFFFFF',
        'card-foreground': '#082532',
        muted: '#EAF4F6',
        'muted-foreground': '#5C6F78',
        border: 'rgba(8, 37, 50, 0.10)',
        input: 'rgba(8, 37, 50, 0.14)',
        ring: '#1296A3',
        ocean: {
          abyss: '#082532',
          deep: '#0A3442',
          reef: '#0E7C86',
          teal: '#1296A3',
          glow: '#1296A3',
          foam: '#DDF4F6'
        },
        gold: {
          DEFAULT: '#D9B56D',
          soft: '#F4E4C0',
          deep: '#9F7832'
        },
        pearl: {
          DEFAULT: '#082532',
          muted: '#5C6F78'
        },
        primary: {
          DEFAULT: '#0E7C86',
          foreground: '#FFFFFF',
          50: '#F0FAFB',
          100: '#DDF4F6',
          500: '#1296A3',
          600: '#0E7C86',
          700: '#0B6670',
          800: '#0A4C58',
          900: '#082532'
        },
        accent: {
          DEFAULT: '#D9B56D',
          foreground: '#082532',
          50: '#FFF9ED',
          100: '#F8E8C7',
          500: '#D9B56D',
          600: '#B88D43',
          700: '#8E682D'
        },
        ivory: {
          DEFAULT: '#FFFFFF',
          100: '#F3F8FA'
        },
        ink: {
          DEFAULT: '#082532',
          deep: '#051A24'
        },
        whatsapp: '#25D366'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Georgia', 'Times New Roman', 'serif']
      },
      boxShadow: {
        glass: '0 12px 36px rgba(8, 37, 50, 0.08)',
        premium: '0 24px 70px rgba(8, 37, 50, 0.12)',
        glow: '0 12px 30px rgba(14, 124, 134, 0.16)'
      }
    }
  },
  plugins: []
};

export default config;
