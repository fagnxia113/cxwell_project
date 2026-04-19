/**
 * Design Token 系统 - 单一数据源
 *
 * 页面标题规范:
 * - 字体: text-2xl (24px), font-bold (700)
 * - 颜色: text-slate-700 (#334155)
 * - 图标容器: p-2 bg-primary rounded-lg text-white shadow-brand
 *
 * 按钮规范:
 * - 主按钮: btn-primary (bg-primary text-white)
 * - 次要按钮: btn-secondary (bg-slate-700 text-white)
 * - 幽灵按钮: btn-ghost (bg-white border text-slate-600)
 *
 * 卡片规范:
 * - 标准卡片: premium-card
 * - 过滤栏: premium-card
 */

export const tokens = {
  color: {
    brand: {
      primary: '#313a72',
      secondary: '#4b648c',
      accent: '#00cc79',
      accentHover: '#00b86e',
      accentSoft: 'rgba(0, 204, 121, 0.1)',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    surface: {
      bgMesh: 'linear-gradient(135deg, rgba(5, 150, 105, 0.03) 0%, rgba(52, 211, 153, 0.05) 100%)',
      glass: 'rgba(255, 255, 255, 0.7)',
      glassBorder: 'rgba(255, 255, 255, 0.4)',
      sidebarDark: '#064e3b',
    },
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadow: {
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
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  typography: {
    fontFamily: {
      sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
  },
  animation: {
    fadeIn: 'fadeIn 0.5s ease-out forwards',
    slideUp: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pulseSubtle: 'pulse-subtle 2s ease-in-out infinite',
  },
  transition: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
} as const

export type Tokens = typeof tokens
export type BrandColor = keyof typeof tokens.color.brand
export type SemanticColor = keyof typeof tokens.color.semantic
export type NeutralColor = keyof typeof tokens.color.neutral
export type RadiusSize = keyof typeof tokens.radius
export type ShadowSize = keyof typeof tokens.shadow
