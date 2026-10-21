import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { HomePromoCarousel } from '@/components/HomePromoCarousel';
import type { HomeReferralPromo } from '@/api/home';
import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import type { TranslationKey } from '@/locales';
import { homePromoClientSeed } from '@/utils/homePromoCoupon';
import { buildHomePromoFeed } from '@/utils/homePromoFeed';
import type { HomePromoCarouselLayout } from '@/utils/homePromoLayout';

const HOME_TIME_TICK_MS = 15_000;

type Props = {
  posters: ClientPoster[];
  coupons: ClientCoupon[];
  referral: HomeReferralPromo | null;
  clientSeedKey: string;
  layout: HomePromoCarouselLayout;
  t: (key: TranslationKey) => string;
  onReferralPress: (promo: HomeReferralPromo) => void;
};

/** Promo karusel — vlastní časovač pro feed závislý na `now`. */
export default function HomePromoFeedSection({
  posters,
  coupons,
  referral,
  clientSeedKey,
  layout,
  t,
  onReferralPress,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), HOME_TIME_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const clientPromoSeed = useMemo(() => homePromoClientSeed(clientSeedKey), [clientSeedKey]);

  const feed = useMemo(
    () =>
      buildHomePromoFeed(posters, coupons, {
        nowMs: now,
        clientSeed: clientPromoSeed,
        referral,
      }),
    [posters, coupons, now, clientPromoSeed, referral]
  );

  const handleReferral = useCallback(
    (promo: HomeReferralPromo) => onReferralPress(promo),
    [onReferralPress]
  );

  if (feed.length === 0) return null;

  return (
    <View className="mt-6">
      <HomePromoCarousel
        feed={feed}
        layout={layout}
        loading={false}
        t={t}
        onReferralPress={handleReferral}
      />
    </View>
  );
}
