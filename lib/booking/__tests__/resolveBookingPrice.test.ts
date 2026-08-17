import { describe, expect, it } from 'vitest';

import {
  branchPriceForServiceId,
  isValidBookingPrice,
  resolveBookingPrice,
} from '@/lib/booking/resolveBookingPrice';

describe('resolveBookingPrice', () => {
  it('prefers employee price over branch and service', () => {
    expect(
      resolveBookingPrice({
        employee: { id: 'e1', price: 450 },
        branch: { id: 'b1', priceFrom: 300 },
        branchPriceForService: 350,
        service: { id: 's1', pricing: { minPrice: 400, kind: 'from' } },
      })
    ).toEqual({ amount: 450, kind: 'exact' });
  });

  it('uses branchPriceForService when employee has no price', () => {
    expect(
      resolveBookingPrice({
        employee: { id: 'any' },
        branchPriceForService: 380,
        branch: { id: 'b1', priceFrom: 300 },
        service: { id: 's1', pricing: { minPrice: 400, kind: 'from' } },
      })
    ).toEqual({ amount: 380, kind: 'from' });
  });

  it('uses selectedBranch.priceFrom before service catalog price', () => {
    expect(
      resolveBookingPrice({
        branch: { id: 'b1', priceFrom: 320 },
        service: { id: 's1', pricing: { minPrice: 400, kind: 'from' } },
      })
    ).toEqual({ amount: 320, kind: 'from' });
  });

  it('falls back to service pricing', () => {
    expect(
      resolveBookingPrice({
        service: { id: 's1', pricing: { minPrice: 410, kind: 'exact' } },
      })
    ).toEqual({ amount: 410, kind: 'exact' });
  });

  it('returns null for missing or non-positive prices', () => {
    expect(
      resolveBookingPrice({
        employee: { id: 'e1', price: 0 },
        branch: { id: 'b1', priceFrom: null as unknown as number },
        service: { id: 's1', pricing: { minPrice: 0, kind: 'from' } },
      })
    ).toEqual({ amount: null, kind: 'from' });
  });
});

describe('isValidBookingPrice', () => {
  it('accepts finite numbers above zero', () => {
    expect(isValidBookingPrice(1)).toBe(true);
    expect(isValidBookingPrice(0)).toBe(false);
    expect(isValidBookingPrice(null)).toBe(false);
  });
});

describe('branchPriceForServiceId', () => {
  it('reads from catalog map', () => {
    expect(branchPriceForServiceId('s1', { s1: 390, s2: 0 })).toBe(390);
    expect(branchPriceForServiceId('s2', { s1: 390, s2: 0 })).toBeNull();
  });
});
