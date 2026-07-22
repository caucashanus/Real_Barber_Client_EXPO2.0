/** Semantic button tokens aligned with the product design system. */
export const BUTTON_TOKENS = {
  primary: '#767676',
  primaryForeground: '#FFFFFF',
  accent: '#FF4F31',
  foreground: '#F1F1F1',
  secondary: '#0F0F0F',
  secondaryForeground: '#FFFFFF',
  destructive: '#DC2626',
  border: '#404040',
} as const;

/**
 * Outline variant — secondary action on app surfaces.
 * Dark mode: gray border + white text. Light mode: black border + black text.
 */
export const BUTTON_OUTLINE = {
  dark: {
    borderColor: 'rgba(255, 255, 255, 0.35)',
    textColor: '#FFFFFF',
    pressedBackgroundClassName: 'active:bg-white/10',
  },
  light: {
    borderColor: 'rgba(0, 0, 0, 0.35)',
    textColor: '#000000',
    pressedBackgroundClassName: 'active:bg-black/10',
  },
  lightCard: {
    borderColor: 'rgba(0, 0, 0, 0.25)',
    textColor: '#000000',
    pressedBackgroundClassName: 'active:bg-black/5',
  },
} as const;

/**
 * Choice variant — slot/day/tier pickers.
 * Unselected: subtle border + muted text.
 * Selected: user accent (@app_accent_color) border ~70 % + bg ~15 % via AppButton.
 * Static `selected` below is fallback when accentColor is not passed.
 */
export const BUTTON_CHOICE = {
  dark: {
    default: {
      borderColor: 'rgba(255, 255, 255, 0.20)',
      textColor: 'rgba(241, 241, 241, 0.9)',
      backgroundColor: 'transparent',
      pressedBackgroundClassName: 'active:bg-white/10',
      fontWeight: '500' as const,
    },
    selected: {
      borderColor: 'rgba(255, 79, 49, 0.70)',
      textColor: '#F1F1F1',
      backgroundColor: 'rgba(255, 79, 49, 0.15)',
      pressedBackgroundClassName: 'active:bg-brand-accent/20',
      fontWeight: '600' as const,
    },
  },
  light: {
    default: {
      borderColor: 'rgba(0, 0, 0, 0.20)',
      textColor: 'rgba(0, 0, 0, 0.9)',
      backgroundColor: 'transparent',
      pressedBackgroundClassName: 'active:bg-black/10',
      fontWeight: '500' as const,
    },
    selected: {
      borderColor: 'rgba(255, 79, 49, 0.70)',
      textColor: '#000000',
      backgroundColor: 'rgba(255, 79, 49, 0.15)',
      pressedBackgroundClassName: 'active:bg-brand-accent/20',
      fontWeight: '600' as const,
    },
  },
  lightCard: {
    default: {
      borderColor: 'rgba(0, 0, 0, 0.20)',
      textColor: 'rgba(0, 0, 0, 0.9)',
      backgroundColor: 'transparent',
      pressedBackgroundClassName: 'active:bg-black/5',
      fontWeight: '500' as const,
    },
    selected: {
      borderColor: 'rgba(255, 79, 49, 0.70)',
      textColor: '#000000',
      backgroundColor: 'rgba(255, 79, 49, 0.15)',
      pressedBackgroundClassName: 'active:bg-brand-accent/20',
      fontWeight: '600' as const,
    },
  },
} as const;

export type ButtonTokenKey = keyof typeof BUTTON_TOKENS;
