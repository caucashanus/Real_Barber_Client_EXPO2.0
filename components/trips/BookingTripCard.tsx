import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import LiveIndicator from '@/components/LiveIndicator';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import BookingTripCountdown from '@/components/trips/BookingTripCountdown';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getBookingStartDate,
  getBookingUiStatusTranslationKey,
  isBookingCancelledLike,
  isBookingCurrent,
  isBookingPast,
  isBookingUpcoming,
} from '@/utils/bookingHelpers';
import { shadowPresets } from '@/utils/useShadow';

export function BookingTripYearDivider({ year }: { year: string }) {
  return (
    <View className="mb-3 mt-1 w-full">
      <ThemedText className="text-xs font-medium uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
        {year}
      </ThemedText>
    </View>
  );
}

type BookingTripCardProps = {
  booking: Booking;
  dateText: string;
  reviewRating?: number;
  onOpenReview?: () => void;
};

export default function BookingTripCard({
  booking,
  dateText,
  reviewRating,
  onOpenReview,
}: BookingTripCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const title = booking.item?.name ?? 'Booking';
  const couponUsages = booking.couponUsages ?? [];
  const hasCoupon = couponUsages.length > 0;
  const couponBagLabel = hasCoupon
    ? couponUsages[0]?.coupon?.name?.trim() || couponUsages[0]?.coupon?.code?.trim() || null
    : null;
  const isPast = isBookingPast(booking);
  const isCurrent = isBookingCurrent(booking);
  const isUpcoming = isBookingUpcoming(booking);
  const hasReview = reviewRating != null && reviewRating >= 1;
  const isCancelled = isBookingCancelledLike(booking);

  const statusLabel = t(getBookingUiStatusTranslationKey(booking));

  const getStatusPillClass = () => {
    if (isCancelled) return 'bg-red-100 dark:bg-red-900/30';
    if (isCurrent) return 'bg-green-100 dark:bg-green-900/30';
    if (isPast) return 'bg-neutral-100 dark:bg-neutral-800';
    return 'bg-neutral-100 dark:bg-neutral-800';
  };

  const getStatusTextClass = () => {
    if (isCancelled) return 'text-red-700 dark:text-red-300';
    if (isCurrent) return 'text-green-700 dark:text-green-300';
    if (isPast) return 'text-neutral-600 dark:text-neutral-400';
    return 'text-neutral-700 dark:text-neutral-300';
  };

  const cardOpacity = isCancelled ? 'opacity-70' : 'opacity-100';

  const goToDetail = () => router.push(`/screens/booking-detail?id=${booking.id}`);

  return (
    <View
      style={shadowPresets.card}
      className={`mt-4 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-light-primary dark:border-neutral-700 dark:bg-dark-primary ${cardOpacity}`}>
      <Pressable onPress={goToDetail} className="p-5" android_ripple={null}>
        <View className="min-w-0 flex-1">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <View className="flex-row items-center">
              <View className={`rounded-full px-2.5 py-1 ${getStatusPillClass()}`}>
                <ThemedText className={`text-xs font-semibold ${getStatusTextClass()}`}>
                  {statusLabel}
                </ThemedText>
              </View>
              {isCurrent ? (
                <View className="ml-2">
                  <LiveIndicator />
                </View>
              ) : null}
            </View>
            {isUpcoming ? (
              <View className="shrink-0 rounded-full bg-light-secondary px-2.5 py-1 dark:bg-dark-secondary">
                <BookingTripCountdown target={getBookingStartDate(booking)} />
              </View>
            ) : null}
          </View>
          <View className="flex-row items-start gap-3">
            <View className="min-w-0 flex-1">
              <ThemedText className="text-lg font-semibold" numberOfLines={2}>
                {title}
              </ThemedText>
              <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
                {dateText}
              </ThemedText>
              {booking.branch?.name ? (
                <ThemedText
                  className="mt-1 text-xs text-light-subtext dark:text-dark-subtext"
                  numberOfLines={1}>
                  {booking.branch.name}
                </ThemedText>
              ) : null}
              {couponBagLabel ? (
                <View className="mt-1.5 max-w-full self-start rounded-full bg-light-secondary px-2.5 py-1 dark:bg-dark-secondary">
                  <ThemedText
                    className="text-xs font-semibold text-light-text dark:text-dark-text"
                    numberOfLines={1}>
                    {couponBagLabel}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Avatar
              src={booking.employee?.avatarUrl ?? undefined}
              name={booking.employee?.name}
              size="md"
            />
          </View>
        </View>
      </Pressable>
      {!isCancelled ? (
        <View className="flex-row rounded-b-2xl bg-light-surface dark:bg-dark-secondary">
          {isCurrent ? (
            <Button
              variant="ghost"
              size="small"
              title="Zobrazit probíhající rezervaci"
              onPress={goToDetail}
              className="flex-1 rounded-none rounded-b-2xl px-0 py-3.5"
              textClassName="text-sm font-semibold text-green-600 dark:text-green-400"
            />
          ) : (
            <View className="w-full flex-row">
              <Button
                variant="ghost"
                size="small"
                title={t('tripsViewBooking')}
                onPress={goToDetail}
                className="flex-1 rounded-none rounded-bl-2xl px-0 py-3.5"
                textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
              />
              <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
              {isPast && !hasReview ? (
                <Button
                  variant="ghost"
                  size="small"
                  title={t('tripsAddReview')}
                  onPress={onOpenReview}
                  className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
                  textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                />
              ) : isPast && hasReview ? (
                <TouchableOpacity
                  onPress={onOpenReview}
                  activeOpacity={0.7}
                  className="flex-1 items-center justify-center rounded-br-2xl py-3.5">
                  <ShowRating rating={reviewRating!} size="sm" displayMode="stars" />
                </TouchableOpacity>
              ) : isUpcoming ? (
                <Button
                  variant="ghost"
                  size="small"
                  title={t('bookingDetailMoveButton')}
                  iconStart="Calendar"
                  iconSize={16}
                  onPress={() =>
                    router.push(`/screens/reschedule?id=${encodeURIComponent(booking.id)}`)
                  }
                  className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
                  textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="small"
                  title={t('tripsMessage')}
                  onPress={() => router.push('/screens/chat/user')}
                  className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
                  textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                />
              )}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}