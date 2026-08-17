/**
 * Global button variant styles (default, outline, choice, panel, secondary, ghost, destructive, link).
 * Use via `AppButton` or `getAppButtonClasses()` — do not hand-roll per screen.
 *
 * Default (`variant="default"`) — web-aligned name, app-only use:
 * booking / Rezervovat CTA (header, hero, sticky profil, submit). Prefer `<ReserveButton />`.
 * Background uses user accent (`AccentColorContext`); falls back to brand `#FF4F31`.
 *
 * Outline (`variant="outline"`):
 * - default surface, dark mode → gray border, white text, white/10 hover
 * - default surface, light mode → black border, black text, black/10 hover
 * - light-card surface → black/25 border, black text (for cards on light panels)
 *
 * Soft (`variant="soft"`):
 * - accent tint chip (badge Nový, promo). Not solid CTA. Use `<SoftChip />` when non-interactive.
 */
import type { ViewStyle } from 'react-native';

import { BUTTON_CHOICE, BUTTON_OUTLINE, BUTTON_SOFT, BUTTON_TOKENS, SOFT_CHIP_LAYOUT } from '@/constants/buttonTokens';
import { hexToRgba } from '@/utils/colorHelpers';

export type AppButtonVariant =
  | 'default'
  | 'outline'
  | 'choice'
  | 'panel'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'link'
  | 'soft';

export type AppButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

/** Surface context for outline/choice on lighter cards (`.card-variant-light`). */
export type AppButtonSurface = 'default' | 'light-card';

export type AppButtonRounded = 'md' | 'lg' | 'full';

export interface AppButtonVariantOptions {
  variant: AppButtonVariant;
  size?: AppButtonSize;
  selected?: boolean;
  disabled?: boolean;
  surface?: AppButtonSurface;
  rounded?: AppButtonRounded;
  fullWidth?: boolean;
  isDark?: boolean;
  /** User accent from AsyncStorage — default CTA bg; choice selected border/bg (~70 % / ~15 %). */
  accentColor?: string;
  className?: string;
  textClassName?: string;
}

const ROUNDED: Record<AppButtonRounded, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const SIZE_CONTAINER: Record<AppButtonSize, string> = {
  xs: 'h-[22px] justify-center px-1.5',
  sm: 'px-3 py-1.5 min-h-8',
  md: 'px-4 py-3',
  lg: 'px-4 py-5',
  icon: 'h-9 w-9 p-0',
  'icon-sm': 'h-8 w-8 p-0',
};

const SIZE_TEXT: Record<AppButtonSize, string> = {
  xs: 'text-xs leading-tight',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
  icon: 'text-sm',
  'icon-sm': 'text-xs',
};

function joinClasses(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(' ');
}

function getDefaultRounded(variant: AppButtonVariant, rounded?: AppButtonRounded): string {
  if (rounded) return ROUNDED[rounded];
  if (variant === 'default') return ROUNDED.md;
  if (variant === 'link') return ROUNDED.md;
  return ROUNDED.lg;
}

function getOutlineTheme(surface: AppButtonSurface, isDark: boolean) {
  if (surface === 'light-card') return BUTTON_OUTLINE.lightCard;
  return isDark ? BUTTON_OUTLINE.dark : BUTTON_OUTLINE.light;
}

function getOutlineBorderStyle(
  surface: AppButtonSurface,
  isDark: boolean
): ViewStyle | undefined {
  return { borderColor: getOutlineTheme(surface, isDark).borderColor };
}

function getChoiceTheme(
  surface: AppButtonSurface,
  isDark: boolean,
  selected: boolean,
  accentColor?: string
) {
  const palette =
    surface === 'light-card' ? BUTTON_CHOICE.lightCard : isDark ? BUTTON_CHOICE.dark : BUTTON_CHOICE.light;

  if (selected && accentColor) {
    const fallback = palette.selected;
    return {
      borderColor: hexToRgba(accentColor, 0.7),
      textColor: fallback.textColor,
      backgroundColor: hexToRgba(accentColor, 0.15),
      pressedBackgroundClassName: 'active:opacity-90',
      fontWeight: fallback.fontWeight,
    };
  }

  return selected ? palette.selected : palette.default;
}

function getChoiceContainerStyle(
  surface: AppButtonSurface,
  isDark: boolean,
  selected: boolean,
  accentColor?: string
): ViewStyle {
  const theme = getChoiceTheme(surface, isDark, selected, accentColor);
  return {
    borderColor: theme.borderColor,
    backgroundColor: theme.backgroundColor,
  };
}

function getDefaultContainerStyle(accentColor?: string): ViewStyle {
  return {
    backgroundColor: accentColor?.trim() || BUTTON_TOKENS.accent,
  };
}

function resolveAccentColor(accentColor?: string): string {
  return accentColor?.trim() || BUTTON_TOKENS.accent;
}

function getSoftTheme(accentColor?: string) {
  const accent = resolveAccentColor(accentColor);
  return {
    backgroundColor: hexToRgba(accent, BUTTON_SOFT.backgroundAlpha),
    borderColor: hexToRgba(accent, BUTTON_SOFT.borderAlpha),
    textColor: accent,
    pressedBackgroundColor: hexToRgba(accent, BUTTON_SOFT.pressedBackgroundAlpha),
  };
}

function getSoftContainerStyle(accentColor?: string): ViewStyle {
  const theme = getSoftTheme(accentColor);
  return {
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderWidth: BUTTON_SOFT.borderWidth,
  };
}

export function getSoftChipClasses(
  accentColor?: string,
  className?: string,
  textClassName?: string
): {
  container: string;
  text: string;
  containerStyle: ViewStyle;
  textStyle: ViewStyle;
} {
  const theme = getSoftTheme(accentColor);
  return {
    container: joinClasses(SOFT_CHIP_LAYOUT.container, className),
    text: joinClasses(SOFT_CHIP_LAYOUT.text, textClassName),
    containerStyle: getSoftContainerStyle(accentColor),
    textStyle: { color: theme.textColor },
  };
}

function getVariantContainerClasses(
  variant: AppButtonVariant,
  options: Pick<AppButtonVariantOptions, 'selected' | 'surface' | 'isDark' | 'accentColor'>
): string {
  const { selected = false, surface = 'default', isDark = false, accentColor } = options;
  const onLightCard = surface === 'light-card';

  switch (variant) {
    case 'default':
      return 'border-0 active:opacity-90';
    case 'outline':
      return joinClasses(
        'border bg-transparent',
        getOutlineTheme(surface, isDark).pressedBackgroundClassName
      );
    case 'choice':
      return joinClasses(
        'border',
        getChoiceTheme(surface, isDark, selected, accentColor).pressedBackgroundClassName
      );
    case 'panel':
      return onLightCard
        ? 'h-auto gap-3 border border-black/15 bg-black/5 px-3 py-3 active:bg-black/5'
        : 'h-auto gap-3 border border-black/15 bg-black/5 px-3 py-3 active:bg-black/5 dark:border-white/15 dark:bg-black/25 dark:active:bg-white/5';
    case 'secondary':
      return isDark
        ? 'border border-white/35 bg-dark-secondary active:bg-white/10'
        : 'border border-brand-border bg-brand-secondary active:opacity-90';
    case 'ghost':
      return onLightCard
        ? 'border-0 bg-transparent active:bg-black/5'
        : 'border-0 bg-transparent active:bg-black/5 dark:active:bg-white/10';
    case 'destructive':
      return 'border-0 bg-brand-destructive active:opacity-90';
    case 'link':
      return 'border-0 bg-transparent active:opacity-80';
    case 'soft':
      return 'active:opacity-90';
    default:
      return '';
  }
}

function getVariantTextClasses(
  variant: AppButtonVariant,
  options: Pick<AppButtonVariantOptions, 'selected' | 'surface' | 'isDark' | 'accentColor'>
): string {
  const { selected = false, surface = 'default', isDark = false, accentColor } = options;
  const onLightCard = surface === 'light-card';

  switch (variant) {
    case 'default':
      return 'font-medium text-white';
    case 'outline':
      return 'font-medium';
    case 'choice':
      return getChoiceTheme(surface, isDark, selected, accentColor).fontWeight === '600'
        ? 'font-semibold'
        : 'font-medium';
    case 'panel':
      return onLightCard
        ? 'font-medium text-light-text'
        : 'font-medium text-light-text dark:text-brand-foreground';
    case 'secondary':
      return isDark
        ? 'font-medium text-white'
        : 'font-medium text-brand-secondary-foreground';
    case 'ghost':
      return onLightCard
        ? 'font-medium text-light-text/80 active:text-light-text'
        : 'font-medium text-light-text/80 active:text-light-text dark:text-brand-foreground/80 dark:active:text-brand-foreground';
    case 'destructive':
      return 'font-semibold text-brand-primary-foreground';
    case 'link':
      return onLightCard
        ? 'font-medium text-light-text underline-offset-4 active:underline'
        : 'font-medium text-light-text underline-offset-4 active:underline dark:text-brand-foreground';
    case 'soft':
      return 'font-semibold';
    default:
      return 'font-medium text-light-text dark:text-dark-text';
  }
}

function getLayoutClasses(variant: AppButtonVariant, fullWidth?: boolean): string {
  const base =
    variant === 'choice'
      ? 'flex-row items-center justify-start'
      : variant === 'soft'
        ? 'flex-row items-center justify-center gap-1.5'
        : 'flex-row items-center justify-center';
  if (variant === 'panel') {
    return joinClasses(base.replace('justify-center', 'justify-start'), fullWidth && 'w-full');
  }
  return joinClasses(base, fullWidth && 'w-full');
}

/** Returns NativeWind class strings and optional inline styles for the global button system. */
export function getAppButtonClasses(options: AppButtonVariantOptions): {
  container: string;
  text: string;
  containerStyle?: ViewStyle;
  textStyle?: ViewStyle;
} {
  const {
    variant,
    size = variant === 'choice' ? 'xs' : variant === 'soft' ? 'sm' : 'md',
    selected,
    disabled,
    surface,
    rounded,
    fullWidth,
    isDark,
    accentColor,
    className,
    textClassName,
  } = options;

  const container = joinClasses(
    variant === 'soft'
      ? SOFT_CHIP_LAYOUT.container
      : joinClasses(
          getLayoutClasses(variant, fullWidth),
          getDefaultRounded(variant, rounded),
          SIZE_CONTAINER[size]
        ),
    getVariantContainerClasses(variant, { selected, surface, isDark, accentColor }),
    disabled && 'opacity-50',
    className
  );

  const text = joinClasses(
    variant === 'soft' ? SOFT_CHIP_LAYOUT.text : SIZE_TEXT[size],
    getVariantTextClasses(variant, { selected, surface, isDark, accentColor }),
    textClassName
  );

  const outlineTheme =
    variant === 'outline' ? getOutlineTheme(surface ?? 'default', isDark ?? false) : undefined;
  const choiceTheme =
    variant === 'choice'
      ? getChoiceTheme(surface ?? 'default', isDark ?? false, selected ?? false, accentColor)
      : undefined;

  const softTheme = variant === 'soft' ? getSoftTheme(accentColor) : undefined;

  return {
    container,
    text,
    containerStyle:
      variant === 'default'
        ? getDefaultContainerStyle(accentColor)
        : variant === 'outline'
          ? getOutlineBorderStyle(surface ?? 'default', isDark ?? false)
          : variant === 'choice'
            ? getChoiceContainerStyle(
                surface ?? 'default',
                isDark ?? false,
                selected ?? false,
                accentColor
              )
            : variant === 'soft'
              ? getSoftContainerStyle(accentColor)
              : undefined,
    textStyle:
      softTheme
        ? { color: softTheme.textColor }
        : outlineTheme || choiceTheme
          ? { color: (outlineTheme ?? choiceTheme)?.textColor }
          : undefined,
  };
}
