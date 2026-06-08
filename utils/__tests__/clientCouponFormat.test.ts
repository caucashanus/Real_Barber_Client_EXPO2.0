import { describe, expect, it } from 'vitest';

import {
  getClientCouponValidityA11y,
  resolveClientCouponValidity,
  shouldShowClientCouponLimitedScopeHint,
} from '@/utils/clientCouponFormat';

describe('clientCouponFormat', () => {
  it('returns validity when validUntil is set', () => {
    const result = resolveClientCouponValidity('', '2026-12-31T00:00:00.000Z', 'cs');
    expect(result?.untilDisplay).toBeTruthy();
  });

  it('returns null without validUntil', () => {
    expect(resolveClientCouponValidity('', null, 'cs')).toBeNull();
  });

  it('builds a11y label when validity exists', () => {
    const label = getClientCouponValidityA11y('', '2026-12-31T00:00:00.000Z', 'cs', (k) => k);
    expect(label).toContain('homeCouponValidityPillUntil');
  });

  it('hides limited scope hint when description repeats label', () => {
    expect(
      shouldShowClientCouponLimitedScopeHint(
        false,
        'Pouze u vybraných poboček, služeb nebo holičů',
        'Limited'
      )
    ).toBe(false);
  });
});
