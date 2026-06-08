import { describe, expect, it } from 'vitest';

import {
  buildFullPhone,
  digitsOnlyPhone,
  formatPhoneDisplay,
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
    expect(digitsOnlyPhone('774 522 114')).toBe('774522114');
  });
});
