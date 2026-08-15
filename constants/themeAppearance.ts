export type ThemePreference = 'system' | 'dark' | 'light';

export const THEME_STORAGE_KEY = '@app_color_scheme';

const VALID_PREFERENCES = new Set<ThemePreference>(['system', 'dark', 'light']);

/** System preference always resolves to dark — OS light is not followed. */
export function resolveColorScheme(preference: ThemePreference): 'dark' | 'light' {
  return preference === 'light' ? 'light' : 'dark';
}

export function parseThemePreference(stored: string | null | undefined): ThemePreference {
  if (stored && VALID_PREFERENCES.has(stored as ThemePreference)) {
    return stored as ThemePreference;
  }
  return 'system';
}
