import { tokens } from './design-tokens'

export function generateCSSVariables(): string {
  const { color, radius, shadow, spacing, typography, transition } = tokens

  const cssParts: string[] = []

  cssParts.push(':root {')

  cssParts.push('  /* ===== Brand Colors ===== */')
  Object.entries(color.brand).forEach(([key, value]) => {
    cssParts.push(`  --color-brand-${key}: ${value};`)
  })

  cssParts.push('')
  cssParts.push('  /* ===== Semantic Colors ===== */')
  Object.entries(color.semantic).forEach(([key, value]) => {
    cssParts.push(`  --color-semantic-${key}: ${value};`)
  })

  cssParts.push('')
  cssParts.push('  /* ===== Neutral Colors ===== */')
  Object.entries(color.neutral).forEach(([key, value]) => {
    cssParts.push(`  --color-neutral-${key}: ${value};`)
  })

  cssParts.push('')
  cssParts.push('  /* ===== Surface Colors ===== */')
  Object.entries(color.surface).forEach(([key, value]) => {
    cssParts.push(`  --color-surface-${key}: ${value};`)
  })

  cssParts.push('')
  cssParts.push('  /* ===== Border Radius ===== */')
  Object.entries(radius).forEach(([key, value]) => {
    cssParts.push(`  --radius-${key}: ${value};`)
  })

  cssParts.push('')
  cssParts.push('  /* ===== Shadows ===== */')
  Object.entries(shadow).forEach(([key, value]) => {
    cssParts.push(`  --shadow-${key}: ${value};`)
  })

  cssParts.push('')
  cssParts.push('  /* ===== Spacing ===== */')
  Object.entries(spacing).forEach(([key, value]) => {
    cssParts.push(`  --spacing-${key}: ${value};`)
  })

  cssParts.push('')
  cssParts.push('  /* ===== Typography ===== */')
  cssParts.push(`  --font-family: ${typography.fontFamily.sans.join(', ')};`)

  cssParts.push('')
  cssParts.push('  /* ===== Transitions ===== */')
  Object.entries(transition).forEach(([key, value]) => {
    cssParts.push(`  --transition-${key}: ${value};`)
  })

  cssParts.push('}')

  return cssParts.join('\n')
}

export function generateTailwindSafeClassNames(): Record<string, string> {
  const { color, radius, shadow, spacing, typography } = tokens

  const safeClasses: Record<string, string> = {}

  Object.entries(color.brand).forEach(([key, value]) => {
    safeClasses[`text-brand-${key}`] = `color: ${value}`
    safeClasses[`bg-brand-${key}`] = `background-color: ${value}`
  })

  Object.entries(color.semantic).forEach(([key, value]) => {
    safeClasses[`text-semantic-${key}`] = `color: ${value}`
    safeClasses[`bg-semantic-${key}`] = `background-color: ${value}`
  })

  Object.entries(radius).forEach(([key, value]) => {
    safeClasses[`rounded-${key}`] = `border-radius: ${value}`
  })

  Object.entries(shadow).forEach(([key, value]) => {
    safeClasses[`shadow-${key}`] = `box-shadow: ${value}`
  })

  return safeClasses
}
