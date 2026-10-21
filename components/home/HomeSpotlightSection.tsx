import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { HomeSpotlightCard } from '@/components/HomeSpotlightCard';
import type { Booking } from '@/api/bookings';
import type { Locale } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { pickHomeSpotlight } from '@/utils/homeSpotlight';

const HOME_TIME_TICK_MS = 15_000;

type Props = {
  bookings: Booking[];
  t: (key: TranslationKey) => string;
  locale: Locale;
};

/** Spotlight — vlastní časovač, aby celá home ne re-renderovala každých 15 s. */
export default function HomeSpotlightSection({ bookings, t, locale }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), HOME_TIME_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const spotlight = useMemo(() => pickHomeSpotlight(bookings, now), [bookings, now]);

  if (!spotlight) return null;

  return (
    <View className="mt-4">
      <HomeSpotlightCard spotlight={spotlight} t={t} locale={locale} />
    </View>
  );
}
