/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colors - exact exported palette via CSS variables
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          'primary-dark': 'var(--brand-primary-dark)',
          secondary: 'var(--brand-secondary)',
        },
        // Canvas colors (theme-aware) — pitch-black dark / white light
        canvas: {
          DEFAULT: 'var(--bg-primary)',
          surface: 'var(--bg-surface)',
          card: 'var(--bg-card)',
          glass: 'var(--bg-glass)',
          border: 'var(--border-primary)',
          'border-secondary': 'var(--border-secondary)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        // Text colors — high-contrast in both themes
        text: {
          heading: 'var(--text-primary)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          body: 'var(--text-body)',
          muted: 'var(--text-muted)',
          inverse: 'var(--bg-primary)',
        },
        // Signature amber accent
        accent: {
          amber: 'var(--accent-amber)',
          'amber-strong': 'var(--accent-amber-strong)',
          headline1: 'var(--headline-1)',
          headline2: 'var(--headline-2)',
          headline3: 'var(--headline-3)',
        },
        // Status colors — contrast-safe text variants included
        success: {
          50: 'var(--success-bg)',
          100: 'var(--success-bg)',
          500: 'var(--success)',
          600: 'var(--success-text)',
          700: 'var(--success-text)',
        },
        warning: {
          50: 'var(--warning-bg)',
          100: 'var(--warning-bg)',
          500: 'var(--warning)',
          600: 'var(--warning-text)',
          700: 'var(--warning-text)',
        },
        error: {
          50: 'var(--error-bg)',
          100: 'var(--error-bg)',
          500: 'var(--error)',
          600: 'var(--error-text)',
          700: 'var(--error-text)',
        },
        info: {
          50: 'var(--info-bg)',
          100: 'var(--info-bg)',
          500: 'var(--info)',
          600: 'var(--info-text)',
          700: 'var(--info-text)',
        },
        // Agent dots
        agent: {
          warm: 'var(--agent-warm)',
          sky: 'var(--agent-sky)',
          emerald: 'var(--agent-emerald)',
        },
        // Integration brand colors (theme-aware)
        integration: {
          slack: 'var(--integration-slack)',
          jira: 'var(--integration-jira)',
          calendar: 'var(--integration-calendar)',
          github: 'var(--integration-github)',
          notion: 'var(--integration-notion)',
        },
        // Legacy aliases — old `base-*` / `electric-*` classes found across
        // components now resolve to theme-aware tokens instead of nothing.
        // No API/logic change; purely keeps legacy markup readable.
        base: {
          300: 'var(--text-muted)',
          400: 'var(--text-muted)',
          500: 'var(--text-muted)',
          600: 'var(--border-secondary)',
          700: 'var(--border-primary)',
          800: 'var(--bg-tertiary)',
          900: 'var(--bg-secondary)',
          950: 'var(--bg-primary)',
        },
        electric: {
          400: 'var(--brand-secondary)',
          500: 'var(--brand-primary)',
          600: 'var(--brand-primary-dark)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        logo: ['Fustat', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        'page-desktop': '80px',
        'page-tablet': '48px',
        'page-mobile': '24px',
        'section-sm': '72px',
        'section-lg': '96px',
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)',
        'glow-blue': '0 0 30px var(--glow-blue)',
        'glow-blue-hover': '0 0 40px var(--glow-blue)',
        'glow-warm': '0 0 30px var(--glow-warm)',
        'glow-warm-hover': '0 0 40px var(--glow-warm)',
        'glow-green': '0 0 30px var(--glow-green)',
        'glow-amber': '0 0 30px var(--glow-amber)',
        'halo': '0 0 42px var(--glow-halo), 0 0 90px var(--glow-halo-soft)',
        'halo-strong': '0 0 60px var(--glow-halo-strong), 0 0 120px var(--glow-halo-soft)',
        'robo': 'var(--robo-shadow)',
      },
      backgroundImage: {
        'headline-gradient': 'linear-gradient(92deg, var(--headline-1), var(--headline-2) 52%, var(--headline-3))',
        'orbit-line': 'linear-gradient(90deg, var(--orbit-from), var(--orbit-to))',
        'visor-bloom': 'radial-gradient(circle, var(--visor-core) 0%, var(--visor-mid) 42%, transparent 72%)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px var(--glow-warm)' },
          '50%': { boxShadow: '0 0 40px var(--glow-warm)' },
        },
      },
    },
  },
  plugins: [],
};