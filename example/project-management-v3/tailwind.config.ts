import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/frontend/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#313a72',
        secondary: '#4b648c',
        accent: '#00cc79',
        'accent-hover': '#00b86e',
        'accent-soft': 'rgba(0, 204, 121, 0.1)',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        'bg-soft': 'linear-gradient(135deg, rgba(5, 150, 105, 0.03) 0%, rgba(52, 211, 153, 0.05) 100%)',
        'text-dark': '#1e293b',
        'text-heading': '#313a72',
        'text-main': '#1e293b',
        'text-secondary': '#475569',
        glass: 'rgba(255, 255, 255, 0.7)',
        'glass-border': 'rgba(255, 255, 255, 0.4)',
        'sidebar-dark': '#064e3b',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        premium: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        brand: '0 4px 14px 0 rgba(49, 58, 114, 0.15)',
        'brand-lg': '0 8px 30px -4px rgba(49, 58, 114, 0.15)',
        accent: '0 4px 14px 0 rgba(0, 204, 121, 0.15)',
        'accent-lg': '0 8px 30px -4px rgba(0, 204, 121, 0.15)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
    },
  },
  plugins: [],
} satisfies Config
