import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';

export type HomePromoFeedItem =
  | { kind: 'coupon'; coupon: ClientCoupon }
  | { kind: 'poster'; poster: ClientPoster };

/** Položka vhodná k zobrazení (alespoň text, médium nebo odkaz). */
export function posterRowUsableForHome(p: ClientPoster): boolean {
  const hasText = Boolean(p.title?.trim() || p.subtitle?.trim());
  const hasMedia = Boolean(p.imageUrl?.trim() || p.videoUrl?.trim());
  const hasLink = Boolean(p.websiteUrl?.trim());
  return hasText || hasMedia || hasLink;
}

export function filterHomePosters(posters: ClientPoster[]): ClientPoster[] {
  return posters.filter(posterRowUsableForHome);
}

/**
 * Střídá plakáty a kupóny (round-robin: plakát, kupon, plakát, …). Zbytek delšího seznamu přidá na konec.
 */
export function mergePostersAndCouponsRoundRobin(
  posters: ClientPoster[],
  coupons: ClientCoupon[]
): HomePromoFeedItem[] {
  const sortedPosters = [...posters].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
  // Pořadí kupónů už řídí buildHomePromoCouponCarouselList — zde jen kopie.
  const sortedCoupons = [...coupons];

  const out: HomePromoFeedItem[] = [];
  let i = 0;
  let j = 0;
  while (i < sortedPosters.length && j < sortedCoupons.length) {
    out.push({ kind: 'poster', poster: sortedPosters[i]! });
    i += 1;
    out.push({ kind: 'coupon', coupon: sortedCoupons[j]! });
    j += 1;
  }
  while (i < sortedPosters.length) {
    out.push({ kind: 'poster', poster: sortedPosters[i]! });
    i += 1;
  }
  while (j < sortedCoupons.length) {
    out.push({ kind: 'coupon', coupon: sortedCoupons[j]! });
    j += 1;
  }
  return out;
}
