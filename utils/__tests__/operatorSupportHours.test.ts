import { describe, expect, it } from 'vitest';

import { getOperatorOpenStatus } from '@/utils/operatorOpenStatus';
import { isOperatorSupportAvailable } from '@/utils/operatorSupportHours';

/** 2026-07-02 (Thu) v Praze — léto CEST = UTC+2. */
function pragueSummerAt(hours: number, minutes: number): Date {
  return new Date(Date.UTC(2026, 6, 2, hours - 2, minutes, 0, 0));
}

describe('operatorSupportHours', () => {
  it('is available when support is open or closing soon', () => {
    expect(isOperatorSupportAvailable(pragueSummerAt(12, 0))).toBe(true);
    expect(isOperatorSupportAvailable(pragueSummerAt(21, 15))).toBe(true);
  });

  it('is unavailable when support is closed or opening soon', () => {
    expect(isOperatorSupportAvailable(pragueSummerAt(7, 0))).toBe(false);
    expect(isOperatorSupportAvailable(pragueSummerAt(8, 15))).toBe(false);
  });

  it('delegates to getOperatorOpenStatus', () => {
    const at = pragueSummerAt(12, 0);
    const status = getOperatorOpenStatus(at);
    expect(isOperatorSupportAvailable(at)).toBe(status === 'open' || status === 'closingSoon');
  });
});
