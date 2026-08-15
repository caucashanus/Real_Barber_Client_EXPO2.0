import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { shadowPresets } from '@/utils/useShadow';

type SurfaceCardRounded = '2xl' | '3xl';

const ROUNDED_CLASS: Record<SurfaceCardRounded, string> = {
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

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
      className={`${ROUNDED_CLASS[rounded]} bg-light-surface dark:bg-dark-secondary ${className}`}>
      {children}
    </View>
  );
}
