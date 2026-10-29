import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import BookingCountdownPill from '@/components/booking/BookingCountdownPill';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getBookingClientReviewRating, getBookingStartDate } from '@/utils/bookingHelpers';
import { resolveBookingDetailStatusHeader } from '@/utils/bookingDetailStatusHeader';
import {
  getHomeSpotlightReviewPath,
  getHomeSpotlightReviewScreenPath,
} from '@/utils/homeSpotlight';

const NOW_TICK_MS = 15_000;
/** Mezera titulku recenze ↔ hvězdičky (RN — spolehlivěji než samotné mt-*). */
const REVIEW_STARS_TOP_GAP = 4;

type Props = {
  booking: Booking;
};

export default function BookingDetailStatusHeader({ booking }: Props) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const model = resolveBookingDetailStatusHeader(booking, nowMs);
  if (!model) return null;

  const liveVariant =
    model.variant === 'red' ? 'red' : model.variant === 'amber' ? 'orange' : 'green';

  const existingReviewRating = getBookingClientReviewRating(booking);
  const starFilledColor = isDark ? '#fbbf24' : '#f59e0b';
  const starEmptyColor = '#525252';

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-2.5">
        <ThemedText className="min-w-0 shrink text-xl font-bold leading-tight">
          {t(model.titleKey)}
        </ThemedText>
        {model.showStatusDot ? (
          <View className="shrink-0">
            <LiveIndicator
              variant={liveVariant}
              size="default"
              animated={model.dotAnimated}
            />
          </View>
        ) : null}
        {model.showCountdownPill ? <View className="min-h-0 min-w-0 flex-1" /> : null}
        {model.showCountdownPill ? (
          <View className="shrink-0">
            <BookingCountdownPill target={getBookingStartDate(booking)} />
          </View>
        ) : null}
      </View>
      {model.showReviewStars ? (
        <View className="flex-row gap-2" style={{ marginTop: REVIEW_STARS_TOP_GAP }}>
          {([1, 2, 3, 4, 5] as const).map((rating) => {
            const filled = existingReviewRating != null && rating <= existingReviewRating;
            return (
              <Pressable
                key={rating}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t('branchReview')}
                onPress={() => {
                  if (existingReviewRating != null) {
                    router.push(getHomeSpotlightReviewScreenPath(booking) as never);
                    return;
                  }
                  router.push(getHomeSpotlightReviewPath(booking, rating) as never);
                }}>
                <Icon
                  name="Star"
                  size={30}
                  color={filled ? starFilledColor : starEmptyColor}
                  fill={filled ? starFilledColor : 'none'}
                  strokeWidth={filled ? 1.5 : 2}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
