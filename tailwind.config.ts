import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#061018',
        foreground: '#F7FAFC',
        card: '#0B1B29',
        'card-foreground': '#F7FAFC',
        muted: '#102638',
        'muted-foreground': '#9FB4C7',
        border: 'rgba(247, 250, 252, 0.14)',
        input: 'rgba(247, 250, 252, 0.16)',
        ring: '#66F6FF',
        ocean: {
          abyss: '#0A0F19',
          deep: '#0E1B25',
          reef: '#073241',
          teal: '#00D4E0',
          glow: '#66F6FF',
          foam: '#E8FBFF'
        },
        gold: {
          DEFAULT: '#D4AF37',
          soft: '#F4D57C',
          deep: '#9D7421'
        },
        pearl: {
          DEFAULT: '#F7FAFC',
          muted: '#C6D6E4'
        },
        primary: {
          DEFAULT: '#00D4E0',
          foreground: '#031016',
          50: '#E8FBFF',
          100: '#C7F7FF',
          500: '#00D4E0',
          600: '#06AFC0',
          700: '#087C8B',
          800: '#0B4D59',
          900: '#0E1B25'
        },
        accent: {
          DEFAULT: '#D4AF37',
          foreground: '#081018',
          50: '#FFF7D6',
          100: '#FBE7A1',
          500: '#D4AF37',
          600: '#B58923',
          700: '#8D651C'
        },
        ivory: {
          DEFAULT: '#F8F6F0',
          100: '#EFE9DE'
        },
        ink: {
          DEFAULT: '#1D2430',
          deep: '#020A2C'
        },
        whatsapp: '#25D366'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
        arabic: ['var(--font-arabic-body)', 'Noto Sans Arabic', 'Tahoma', 'sans-serif'],
        arabicHeading: ['var(--font-arabic-heading)', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Tahoma', 'sans-serif']
      },
      boxShadow: {
        glass: '0 24px 70px rgba(0, 212, 224, 0.08), 0 1px 0 rgba(255, 255, 255, 0.14) inset',
        premium: '0 32px 120px rgba(0, 0, 0, 0.48)',
        glow: '0 0 44px rgba(0, 212, 224, 0.28)'
      },
      backgroundImage: {
        'ocean-radial': 'radial-gradient(circle at 20% 20%, rgba(0, 212, 224, 0.18), transparent 28rem), radial-gradient(circle at 80% 10%, rgba(212, 175, 55, 0.13), transparent 24rem), linear-gradient(180deg, #0A0F19 0%, #07141E 48%, #0A0F19 100%)'
      }
    }
  },
  plugins: []
};

export default config;
