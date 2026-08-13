export const PROMO_POSTER_SEGMENT = 'poster';
export const PROMO_KUPON_SEGMENT = 'kupon';

export type PromoDetailKind = typeof PROMO_POSTER_SEGMENT | typeof PROMO_KUPON_SEGMENT;

export function isPromoDetailKind(value: string): value is PromoDetailKind {
  return value === PROMO_POSTER_SEGMENT || value === PROMO_KUPON_SEGMENT;
}

export function promoPosterHref(id: string): string {
  return `/promo/${PROMO_POSTER_SEGMENT}/${encodeURIComponent(id)}`;
}

export function promoKuponHref(id: string): string {
  return `/promo/${PROMO_KUPON_SEGMENT}/${encodeURIComponent(id)}`;
}
