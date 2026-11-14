import { describe, expect, it } from 'vitest';

import { en } from '@/locales/en';
import {
  formatEmployeeBirthdayPopoverText,
  shouldShowEmployeeBirthdayOnCard,
} from '@/utils/employeeBirthday';

const t = (key: keyof typeof en) => en[key];

describe('employeeBirthday', () => {
  it('hides badge when context day differs from API reference day', () => {
    expect(
      shouldShowEmployeeBirthdayOnCard({
        hasBirthday: true,
        birthdayAge: 30,
        contextDayIso: '2026-11-15',
        referenceDayIso: '2026-11-14',
      })
    ).toBe(false);
  });

  it('uses on this day copy in English, not "today"', () => {
    const text = formatEmployeeBirthdayPopoverText('Alex', 32, t);
    expect(text).toContain('on this day');
    expect(text).not.toMatch(/\btoday\b/i);
    expect(text).toContain('32');
  });

  it('uses v tento den copy in Czech, not dnes', () => {
    const csT = (key: keyof typeof en) =>
      key === 'birthdayPopoverWithAge'
        ? '{name} v tento den slaví své {age}. narozeniny'
        : en[key];
    const text = formatEmployeeBirthdayPopoverText('Jan', 25, csT);
    expect(text).toContain('v tento den');
    expect(text).not.toContain('dnes');
  });
});