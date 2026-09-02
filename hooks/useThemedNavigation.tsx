import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import useThemeColors from '@/contexts/ThemeColors';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * A hook that handles theme-dependent styling for navigation and status bars
 * Returns configuration objects and components for themed navigation
 */
export default function useThemedNavigation() {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  // Set up status/navigation bar styling based on theme
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // SDK 56+: setBackgroundColorAsync / setButtonStyleAsync removed — use setStyle.
    NavigationBar.setStyle?.(isDark ? 'light' : 'dark');
  }, [isDark]);

  // StatusBar component with appropriate theme styling
  const ThemedStatusBar = () => (
    <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
  );

  // Navigation container/stack screen options for themed backgrounds
  const screenOptions = {
    headerShown: false,
    backgroundColor: colors.bg,
    contentStyle: {
      backgroundColor: colors.bg,
    },
  };

  return {
    ThemedStatusBar,
    screenOptions,
    colors,
    isDark,
  };
}
