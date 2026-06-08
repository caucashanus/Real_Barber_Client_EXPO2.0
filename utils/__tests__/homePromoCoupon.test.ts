import { describe, expect, it } from 'vitest';

import type { ClientCoupon } from '@/api/client-coupons';
import {
  buildHomePromoCouponCarouselList,
  homePromoClientSeed,
  isPoznejteHomePromoCoupon,
  splitHomePromoCoupons,
} from '@/utils/homePromoCoupon';

function coupon(partial: Partial<ClientCoupon> & Pick<ClientCoupon, 'id' | 'name'>): ClientCoupon {
  return {
    code: partial.code ?? partial.id,
    description: partial.description ?? null,
    imageUrl: partial.imageUrl ?? null,
    discountType: partial.discountType ?? 'percent',
    discountValue: partial.discountValue ?? 10,
    maxDiscountAmount: partial.maxDiscountAmount ?? null,
    benefitLabel: partial.benefitLabel ?? '10 %',
    applicableToAll: partial.applicableToAll ?? true,
    validFrom: partial.validFrom ?? '2026-01-01',
    validUntil: partial.validUntil ?? '2026-12-31',
    isPublic: partial.isPublic ?? true,
    ...partial,
  };
}

describe('homePromoCoupon', () => {
  it('detects Poznejte coupons by name', () => {
    expect(isPoznejteHomePromoCoupon(coupon({ id: '1', name: 'Poznejte Modřany' }))).toBe(true);
    expect(isPoznejteHomePromoCoupon(coupon({ id: '2', name: 'Welcome bonus' }))).toBe(false);
  });

  it('splits promo coupons into Poznejte and other groups', () => {
    const { poznejte, other } = splitHomePromoCoupons([
      coupon({ id: '1', name: 'Poznejte Hagibor' }),
      coupon({ id: '2', name: 'Birthday gift' }),
    ]);

    expect(poznejte).toHaveLength(1);
    expect(other).toHaveLength(1);
  });

  it('builds carousel with one daily Poznejte coupon', () => {
    const list = buildHomePromoCouponCarouselList(
      [
        coupon({ id: '1', name: 'Poznejte Modřany' }),
        coupon({ id: '2', name: 'Poznejte Hagibor' }),
        coupon({ id: '3', name: 'Birthday gift' }),
      ],
      { nowMs: Date.UTC(2026, 5, 10), clientSeed: homePromoClientSeed('client-1') }
    );

    expect(list.some((c) => c.name === 'Birthday gift')).toBe(true);
    expect(list.filter((c) => isPoznejteHomePromoCoupon(c))).toHaveLength(1);
  });
});
