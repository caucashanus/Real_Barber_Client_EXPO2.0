import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';

import {
  parseThemePreference,
  resolveColorScheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/constants/themeAppearance';

type ThemeContextType = {
  isDark: boolean;
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  const applyPreference = useCallback(
    (next: ThemePreference) => {
      setPreference(next);
      try {
        if (typeof setColorScheme === 'function') {
          setColorScheme(resolveColorScheme(next));
        }
      } catch {
        // nativewind setColorScheme may be read-only in some environments
      }
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
    },
    [setColorScheme]
  );

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      const next = parseThemePreference(stored);
      applyPreference(next);
      setLoaded(true);
    });
  }, [applyPreference]);

  const isDark = loaded ? resolveColorScheme(preference) === 'dark' : true;

  const setThemePreference = useCallback(
    (next: ThemePreference) => {
      applyPreference(next);
    },
    [applyPreference]
  );

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = isDark ? 'light' : 'dark';
    applyPreference(next);
  }, [applyPreference, isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, preference, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
