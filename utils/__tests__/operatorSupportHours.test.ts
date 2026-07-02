import { describe, expect, it } from 'vitest';

import { isOperatorSupportAvailable } from '@/utils/operatorSupportHours';

function localDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): Date {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

describe('operatorSupportHours', () => {
  it('is open on weekday during support hours', () => {
    expect(isOperatorSupportAvailable(localDate(2026, 7, 2, 12, 0))).toBe(true);
    expect(isOperatorSupportAvailable(localDate(2026, 7, 2, 8, 30))).toBe(true);
    expect(isOperatorSupportAvailable(localDate(2026, 7, 2, 21, 30))).toBe(true);
  });

  it('is closed on weekday outside support hours', () => {
    expect(isOperatorSupportAvailable(localDate(2026, 7, 2, 8, 29))).toBe(false);
    expect(isOperatorSupportAvailable(localDate(2026, 7, 2, 21, 31))).toBe(false);
  });

  it('is open on weekend during support hours', () => {
    expect(isOperatorSupportAvailable(localDate(2026, 7, 4, 10, 0))).toBe(true);
    expect(isOperatorSupportAvailable(localDate(2026, 7, 5, 9, 30))).toBe(true);
    expect(isOperatorSupportAvailable(localDate(2026, 7, 5, 18, 30))).toBe(true);
  });

  it('is closed on weekend outside support hours', () => {
    expect(isOperatorSupportAvailable(localDate(2026, 7, 4, 9, 29))).toBe(false);
    expect(isOperatorSupportAvailable(localDate(2026, 7, 4, 18, 31))).toBe(false);
  });
});
