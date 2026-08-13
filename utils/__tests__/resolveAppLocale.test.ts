import { describe, expect, it } from 'vitest';

import {
  resolveAppLocaleFromLanguageCodes,
  resolveLocaleFromLanguageCode,
} from '@/utils/appLocaleResolve';

describe('resolveLocaleFromLanguageCode', () => {
  it('maps Czech codes to cs', () => {
    expect(resolveLocaleFromLanguageCode('cs')).toBe('cs');
    expect(resolveLocaleFromLanguageCode('cs-CZ')).toBe('cs');
  });

  it('maps English codes to en', () => {
    expect(resolveLocaleFromLanguageCode('en')).toBe('en');
    expect(resolveLocaleFromLanguageCode('en-US')).toBe('en');
  });

  it('returns null for unsupported codes', () => {
    expect(resolveLocaleFromLanguageCode('de')).toBeNull();
    expect(resolveLocaleFromLanguageCode(undefined)).toBeNull();
  });
});

describe('resolveAppLocaleFromLanguageCodes', () => {
  it('uses the first supported locale from device preferences', () => {
    expect(resolveAppLocaleFromLanguageCodes(['de', 'en'])).toBe('en');
  });

  it('falls back to cs when no supported locale is found', () => {
    expect(resolveAppLocaleFromLanguageCodes(['de', 'uk'])).toBe('cs');
  });
});
