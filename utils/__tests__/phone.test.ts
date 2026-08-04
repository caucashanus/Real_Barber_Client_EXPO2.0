import { describe, expect, it } from 'vitest';

import {
  buildFullPhone,
  digitsOnlyPhone,
  formatPhoneDisplay,
  normalizeDialCode,
  validatePhoneDigits,
} from '@/utils/phone';

describe('phone utils', () => {
  it('formats display in groups of three', () => {
    expect(formatPhoneDisplay('774522114')).toBe('774 522 114');
  });

  it('validates minimum digit count', () => {
    expect(validatePhoneDigits('12345678').valid).toBe(false);
    expect(validatePhoneDigits('123456789').valid).toBe(true);
  });

  it('builds E.164-style full phone', () => {
    expect(buildFullPhone('+420', '774 522 114')).toBe('+420774522114');
    expect(buildFullPhone('+1-US', '5551234567')).toBe('+15551234567');
    expect(digitsOnlyPhone('774 522 114')).toBe('774522114');
  });

  it('normalizes suffixed dial code values', () => {
    expect(normalizeDialCode('+1-CA')).toBe('+1');
    expect(normalizeDialCode('+7-RU')).toBe('+7');
    expect(normalizeDialCode('+39-IT')).toBe('+39');
    expect(normalizeDialCode('+420')).toBe('+420');
  });
});
