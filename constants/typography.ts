/**
 * REAL BARBER brand typography (Archivo).
 * Print sizes from the identity manual are scaled for mobile screens.
 *
 * Headings: Archivo Bold
 * Subheadings: Archivo Regular (~120% leading)
 * Body: Archivo Regular 15px (manual p.15); Light available for long copy (manual p.17)
 */

export const TYPOGRAPHY = {
  display: { size: 36, lineHeight: 38, fontFamily: 'archivo-bold' as const },
  h1: { size: 28, lineHeight: 30, fontFamily: 'archivo-bold' as const },
  h2: { size: 24, lineHeight: 26, fontFamily: 'archivo-bold' as const },
  h3: { size: 20, lineHeight: 22, fontFamily: 'archivo-bold' as const },
  h4: { size: 18, lineHeight: 20, fontFamily: 'archivo-bold' as const },
  /** Small bold labels (badges, chips, card meta) */
  label: { size: 14, lineHeight: 18, fontFamily: 'archivo-bold' as const },
  /** UI labels that were semibold at 16px (quick actions, list titles, selectable rows) */
  emphasis: { size: 16, lineHeight: 19, fontFamily: 'archivo-bold' as const },
  subtitle: { size: 16, lineHeight: 19, fontFamily: 'archivo' as const },
  body: { size: 15, lineHeight: 24, fontFamily: 'archivo' as const },
  bodySm: { size: 14, lineHeight: 22, fontFamily: 'archivo' as const },
  bodyLight: { size: 15, lineHeight: 25, fontFamily: 'archivo-light' as const },
  caption: { size: 12, lineHeight: 18, fontFamily: 'archivo' as const },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;

/** NativeWind className presets for ThemedText / Section titles */
export const typographyVariantClass: Record<TypographyVariant, string> = {
  display: 'font-archivo-bold text-display leading-display',
  h1: 'font-archivo-bold text-h1 leading-h1',
  h2: 'font-archivo-bold text-h2 leading-h2',
  h3: 'font-archivo-bold text-h3 leading-h3',
  h4: 'font-archivo-bold text-h4 leading-h4',
  label: 'font-archivo-bold text-body-sm leading-body-sm',
  emphasis: 'font-archivo-bold text-base leading-subtitle',
  subtitle: 'font-archivo text-subtitle leading-subtitle',
  body: 'font-archivo text-body leading-body',
  bodySm: 'font-archivo text-body-sm leading-body-sm',
  bodyLight: 'font-archivo-light text-body leading-body-light',
  caption: 'font-archivo text-caption leading-caption',
};

/** Maps Section titleSize to heading variant */
export const sectionTitleVariant: Record<
  'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl',
  TypographyVariant
> = {
  sm: 'h4',
  md: 'h4',
  lg: 'h3',
  xl: 'h2',
  '2xl': 'h2',
  '3xl': 'h1',
  '4xl': 'display',
};
