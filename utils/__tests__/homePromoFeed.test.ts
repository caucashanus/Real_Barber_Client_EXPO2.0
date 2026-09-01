import { describe, expect, it } from 'vitest';

import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import {
  buildHomePromoFeed,
  filterHiddenHomePromoCoupons,
  filterHomePromoFeedWithImages,
  HIDDEN_HOME_PROMO_COUPON_NAMES,
} from '@/utils/homePromoFeed';
import { homePromoClientSeed, isPoznejteHomePromoCoupon } from '@/utils/homePromoCoupon';

function coupon(partial: Partial<ClientCoupon> & Pick<ClientCoupon, 'id' | 'name'>): ClientCoupon {
  return {
    code: partial.code ?? partial.id,
    description: partial.description ?? null,
    imageUrl: partial.imageUrl ?? 'https://example.com/coupon.webp',
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

function poster(partial: Partial<ClientPoster> & Pick<ClientPoster, 'id'>): ClientPoster {
  return {
    title: partial.title ?? 'Poster',
    subtitle: partial.subtitle ?? null,
    imageUrl: partial.imageUrl ?? 'https://example.com/poster.webp',
    videoUrl: partial.videoUrl ?? null,
    websiteUrl: partial.websiteUrl ?? null,
    sortOrder: partial.sortOrder ?? 0,
    ...partial,
  };
}

describe('homePromoFeed', () => {
  it('blacklists hidden coupon names', () => {
    expect(HIDDEN_HOME_PROMO_COUPON_NAMES.has('Gorila10')).toBe(true);
    const filtered = filterHiddenHomePromoCoupons([
      coupon({ id: '1', name: 'Gorila10' }),
      coupon({ id: '2', name: 'Birthday gift' }),
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe('Birthday gift');
  });

  it('builds feed with one daily Poznejte coupon and round-robin merge', () => {
    const feed = buildHomePromoFeed(
      [poster({ id: 'p1', sortOrder: 0 })],
      [
        coupon({ id: 'c1', name: 'Poznejte Modřany' }),
        coupon({ id: 'c2', name: 'Poznejte Hagibor' }),
        coupon({ id: 'c3', name: 'Birthday gift' }),
        coupon({ id: 'c4', name: 'Gorila10' }),
      ],
      {
        nowMs: Date.UTC(2026, 5, 10),
        clientSeed: homePromoClientSeed('client-1'),
      }
    );

    const couponsInFeed = feed.filter((item) => item.kind === 'coupon');
    expect(couponsInFeed.some((item) => item.coupon.name === 'Gorila10')).toBe(false);
    expect(couponsInFeed.some((item) => item.coupon.name === 'Birthday gift')).toBe(true);
    expect(couponsInFeed.filter((item) => isPoznejteHomePromoCoupon(item.coupon))).toHaveLength(1);
    expect(feed[0]?.kind).toBe('poster');
    expect(feed[1]?.kind).toBe('coupon');
  });

  it('keeps only carousel items with image', () => {
    const feed = buildHomePromoFeed(
      [poster({ id: 'p1', imageUrl: '' }), poster({ id: 'p2' })],
      [coupon({ id: 'c1', name: 'Gift', imageUrl: null })],
      { nowMs: Date.now(), clientSeed: 1 }
    );
    const withImages = filterHomePromoFeedWithImages(feed);
    expect(withImages).toHaveLength(1);
    expect(withImages[0]?.kind).toBe('poster');
    expect(withImages[0]?.kind === 'poster' && withImages[0].poster.id).toBe('p2');
  });
});
