import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import { fetchCrm } from '@/api/http';

/** GET /api/offers/coupons — s Bearer = client list (public + app-only pro klienta). */
export async function getOffersCoupons(apiToken: string): Promise<ClientCoupon[]> {
  const data = await fetchCrm<unknown>('/api/offers/coupons', { apiToken });
  if (!Array.isArray(data)) return [];
  return data as ClientCoupon[];
}

/** GET /api/offers/posters — s Bearer = all + authenticated audience. */
export async function getOffersPosters(apiToken: string): Promise<ClientPoster[]> {
  const data = await fetchCrm<unknown>('/api/offers/posters', { apiToken });
  if (!Array.isArray(data)) return [];
  return data as ClientPoster[];
}
