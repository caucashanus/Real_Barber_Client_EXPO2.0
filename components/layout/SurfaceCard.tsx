import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { shadowPresets } from '@/utils/useShadow';

type SurfaceCardRounded = '2xl' | '3xl';

const ROUNDED_CLASS: Record<SurfaceCardRounded, string> = {
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

/** Panel fill — home tiles, wallet cards, branch/barber content cards (light: cement gray). */
export const SURFACE_CARD_BG_CLASS = 'bg-light-surface dark:bg-dark-secondary';

/** Tailwind `light-surface` — pro `indicatorStyle` a další inline styly. */
export const LIGHT_SURFACE_COLOR = '#D1D5DB';

/** Neaktivní chip, switch/toggle track, counter pill, sheet handle (light: stejná šedá jako karty). */
export const INACTIVE_CONTROL_SURFACE_CLASS = SURFACE_CARD_BG_CLASS;

export function getSheetHandleIndicatorColor(isDark: boolean): string {
  return isDark ? 'rgba(255, 255, 255, 0.35)' : LIGHT_SURFACE_COLOR;
}

interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  rounded?: SurfaceCardRounded;
}

/** Panel card — light: cement gray, no shadow; dark: secondary bg + shadow. */
export default function SurfaceCard({
  children,
  className = '',
  style,
  rounded = '3xl',
}: SurfaceCardProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[isDark ? shadowPresets.large : undefined, style]}
      className={`${ROUNDED_CLASS[rounded]} ${SURFACE_CARD_BG_CLASS} ${className}`}>
      {children}
    </View>
  );
}
