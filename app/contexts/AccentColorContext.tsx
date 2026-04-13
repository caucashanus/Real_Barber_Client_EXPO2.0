import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ACCENT_STORAGE_KEY = '@app_accent_color';
const DEFAULT_ACCENT = '#FF2056';

function parseHex(hex: string): string | null {
  const cleaned = hex.replace(/^#/, '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) return `#${cleaned}`;
  if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    const r = cleaned[0] + cleaned[0];
    const g = cleaned[1] + cleaned[1];
    const b = cleaned[2] + cleaned[2];
    return `#${r}${g}${b}`;
  }
  return null;
}

type AccentColorContextType = {
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const AccentColorContext = createContext<AccentColorContextType | null>(null);

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<string>(DEFAULT_ACCENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ACCENT_STORAGE_KEY).then((stored) => {
      if (stored) {
        const parsed = parseHex(stored);
        if (parsed) setAccentColorState(parsed);
      }
      setLoaded(true);
    });
  }, []);

  const setAccentColor = useCallback((color: string) => {
    const parsed = parseHex(color);
    if (!parsed) return;
    setAccentColorState(parsed);
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, parsed).catch(() => {});
  }, []);

  const value: AccentColorContextType = {
    accentColor: loaded ? accentColor : DEFAULT_ACCENT,
    setAccentColor,
  };

  return <AccentColorContext.Provider value={value}>{children}</AccentColorContext.Provider>;
}

export function useAccentColor(): AccentColorContextType {
  const ctx = useContext(AccentColorContext);
  if (!ctx) {
    return {
      accentColor: DEFAULT_ACCENT,
      setAccentColor: () => {},
    };
  }
  return ctx;
}

export { parseHex, DEFAULT_ACCENT };
