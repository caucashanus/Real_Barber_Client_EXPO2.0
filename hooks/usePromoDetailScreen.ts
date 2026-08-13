import { useCallback, useEffect, useState } from 'react';

import { getOffersCoupons, getOffersPosters } from '@/api/offers';
import type { ClientCoupon } from '@/api/client-coupons';
import { getClientCoupons } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import { useAuth } from '@/contexts/AuthContext';
import {
  isPromoDetailKind,
  PROMO_KUPON_SEGMENT,
  PROMO_POSTER_SEGMENT,
  type PromoDetailKind,
} from '@/constants/promoDetailRoutes';

export type PromoDetailData =
  | { kind: typeof PROMO_POSTER_SEGMENT; poster: ClientPoster }
  | { kind: typeof PROMO_KUPON_SEGMENT; coupon: ClientCoupon };

export function usePromoDetailScreen(kindParam: string, id: string) {
  const { apiToken } = useAuth();
  const kind: PromoDetailKind | null = isPromoDetailKind(kindParam) ? kindParam : null;

  const [data, setData] = useState<PromoDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!kind || !id) {
      setData(null);
      setError('not-found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (kind === PROMO_POSTER_SEGMENT) {
        const posters = await getOffersPosters();
        const poster = posters.find((row) => row.id === id) ?? null;
        if (!poster) {
          setData(null);
          setError('not-found');
          return;
        }
        setData({ kind, poster });
        return;
      }

      const publicCoupons = await getOffersCoupons();
      let coupon = publicCoupons.find((row) => row.id === id) ?? null;

      if (!coupon && apiToken) {
        const clientCoupons = await getClientCoupons(apiToken);
        coupon = clientCoupons.find((row) => row.id === id) ?? null;
      }

      if (!coupon) {
        setData(null);
        setError('not-found');
        return;
      }

      setData({ kind, coupon });
    } catch {
      setData(null);
      setError('load-error');
    } finally {
      setLoading(false);
    }
  }, [apiToken, id, kind]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return { data, loading, error, kind, reload: load };
}
