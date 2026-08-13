import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import { fetchCrm } from '@/api/http';

/** GET /api/offers/posters — veřejné marketingové plakáty. */
export async function getOffersPosters(): Promise<ClientPoster[]> {
  const data = await fetchCrm<unknown>('/api/offers/posters', { checkAuth: false });
  if (!Array.isArray(data)) return [];
  return data as ClientPoster[];
}

/** GET /api/offers/coupons — veřejné kupóny (app-only kupóny v seznamu nejsou). */
export async function getOffersCoupons(): Promise<ClientCoupon[]> {
  const data = await fetchCrm<unknown>('/api/offers/coupons', { checkAuth: false });
  if (!Array.isArray(data)) return [];
  return data as ClientCoupon[];
}
