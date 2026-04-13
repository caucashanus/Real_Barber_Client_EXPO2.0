import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = '@app_color_scheme';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      const next = stored === 'dark' || stored === 'light' ? stored : 'light';
      try {
        if (typeof setColorScheme === 'function') {
          setColorScheme(next);
        }
      } catch {
        // nativewind setColorScheme may be read-only in some environments
      }
    });
  }, [setColorScheme]);

  const isDark = colorScheme === 'dark';

  const toggleTheme = useCallback(() => {
    const next = colorScheme === 'dark' ? 'light' : 'dark';
    try {
      if (typeof setColorScheme === 'function') {
        setColorScheme(next);
      }
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
    } catch {
      // nativewind setColorScheme may be read-only in some environments
    }
  }, [colorScheme, setColorScheme]);

  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
