import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#041017',
          900: '#071A24',
          800: '#0B2632',
          700: '#0E3444',
          500: '#1589A6',
          300: '#63D4EA',
        },
        sand: '#D9B56D',
        pearl: '#F6FBFC',
        glass: 'rgba(255,255,255,0.08)',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        luxury: '0 24px 80px rgba(0,0,0,0.42)',
        glow: '0 0 80px rgba(99,212,234,0.18)',
      },
      backgroundImage: {
        'ocean-radial': 'radial-gradient(circle at top left, rgba(99,212,234,0.2), transparent 32%), radial-gradient(circle at bottom right, rgba(217,181,109,0.15), transparent 30%)',
      },
    },
  },
  plugins: [],
};

export default config;
