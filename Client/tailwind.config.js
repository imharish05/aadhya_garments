/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:    'var(--color-background)',
          text:  'var(--color-foreground)',
          gold:  'var(--color-accent)',
          white: '#FFFFFF',
          grey:  'var(--color-grey)',
          light: 'var(--color-border)',
        },
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        playfair:   ['"Playfair Display"', 'Georgia', 'serif'],
        heading:    ['"Playfair Display"', 'Georgia', 'serif'],
        serif:      ['"Playfair Display"', 'Georgia', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        body:       ['Montserrat', 'sans-serif'],
        sans:       ['Montserrat', 'sans-serif'],
        inter:      ['Montserrat', 'sans-serif'],
        jakarta:    ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'hero-title':      ['clamp(36px, 5vw, 56px)', { lineHeight: '1.15', fontWeight: '700' }],
        'page-title':      ['clamp(30px, 4vw, 40px)', { lineHeight: '1.2',  fontWeight: '600' }],
        'section-heading': ['clamp(24px, 3vw, 32px)', { lineHeight: '1.25', fontWeight: '600' }],
        'card-title':      ['clamp(18px, 2.5vw, 22px)', { lineHeight: '1.35', fontWeight: '600' }],
        'body-base':       ['16px', { lineHeight: '1.65', fontWeight: '400' }],
        'body-secondary':  ['13px', { lineHeight: '1.45', fontWeight: '500' }],
        'btn-nav':         ['14px', { lineHeight: '1.4',  fontWeight: '600' }],
        'display':         ['clamp(40px, 5vw, 56px)', { lineHeight: '1.1', fontWeight: '700' }],
        'h1':              ['clamp(32px, 4vw, 40px)', { lineHeight: '1.15', fontWeight: '600' }],
        'h2':              ['clamp(24px, 3vw, 32px)', { lineHeight: '1.2',  fontWeight: '600' }],
        'h3':              ['clamp(18px, 2.5vw, 22px)', { lineHeight: '1.3',  fontWeight: '600' }],
        'caption':         ['13px', { lineHeight: '1.4',  fontWeight: '500' }],
      },
      maxWidth: { 'site': '1440px' },
      boxShadow: {
        'sm':   '0 1px 3px rgba(0,0,0,0.08)',
        'md':   '0 4px 12px rgba(0,0,0,0.1)',
        'lg':   '0 8px 32px rgba(0,0,0,0.12)',
        'gold': '0 0 20px rgba(var(--color-gold-rgb),0.3)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer:    'shimmer 2s linear infinite',
        'fade-up':  'fadeUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.35s ease-out forwards',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [],
}
