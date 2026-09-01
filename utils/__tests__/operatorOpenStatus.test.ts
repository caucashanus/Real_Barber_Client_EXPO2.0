import { describe, expect, it } from 'vitest';

import { getOperatorOpenStatus } from '@/utils/operatorOpenStatus';

/** 2026-07-02 (Thu) v Praze — léto CEST = UTC+2. */
function pragueSummerAt(hours: number, minutes: number): Date {
  return new Date(Date.UTC(2026, 6, 2, hours - 2, minutes, 0, 0));
}

describe('getOperatorOpenStatus', () => {
  it('returns open during weekday support hours', () => {
    expect(getOperatorOpenStatus(pragueSummerAt(12, 0))).toBe('open');
  });

  it('returns closed outside weekday support hours', () => {
    expect(getOperatorOpenStatus(pragueSummerAt(7, 0))).toBe('closed');
  });

  it('returns openingSoon within 30 minutes before open', () => {
    expect(getOperatorOpenStatus(pragueSummerAt(8, 15))).toBe('openingSoon');
  });

  it('returns closingSoon within 30 minutes before close', () => {
    expect(getOperatorOpenStatus(pragueSummerAt(21, 15))).toBe('closingSoon');
  });
});
