import React, { useMemo } from 'react';
import { View, Image } from 'react-native';

import type { Booking } from '@/api/bookings';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

interface CurrentBookingCardProps {
  booking: Booking;
}

export default function CurrentBookingCard({ booking }: CurrentBookingCardProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';

  const dateLabel = useMemo(() => {
    const d = new Date(booking.date);
    if (Number.isNaN(d.getTime())) return (booking.date || '').slice(0, 10);
    return d.toLocaleDateString(dateLocaleTag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [booking.date, dateLocaleTag]);

  return (
    <View className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-light-secondary dark:border-neutral-700 dark:bg-dark-secondary">
      <View className="gap-4 p-4">
        <View>
          <ThemedText className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
            {t('reservationSummaryBranch')}
          </ThemedText>
          <ThemedText className="text-lg font-bold text-light-text dark:text-dark-text">
            {booking.branch?.name ?? '—'}
          </ThemedText>
          {booking.branch?.address ? (
            <View className="mt-2 flex-row items-start">
              <Icon
                name="MapPin"
                size={16}
                className="mr-2 mt-0.5 shrink-0 text-light-subtext dark:text-dark-subtext"
              />
              <ThemedText className="flex-1 text-sm leading-5 text-light-subtext dark:text-dark-subtext">
                {booking.branch.address}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View className="h-px bg-neutral-200 dark:bg-neutral-700" />

        <View>
          <ThemedText className="mb-2 text-xs font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
            {t('bookingInCareOf')}
          </ThemedText>
          <View className="flex-row items-center">
            <Avatar
              size="md"
              src={booking.employee?.avatarUrl ?? undefined}
              name={booking.employee?.name}
            />
            <View className="ml-3 min-w-0 flex-1">
              <ThemedText
                className="text-base font-semibold text-light-text dark:text-dark-text"
                numberOfLines={1}>
                {booking.employee?.name ?? '—'}
              </ThemedText>
              <ThemedText
                className="mt-1 text-sm text-light-subtext dark:text-dark-subtext"
                numberOfLines={2}>
                {booking.item?.name ?? '—'}
              </ThemedText>
            </View>
            {booking.item?.imageUrl ? (
              <Image
                source={{ uri: booking.item.imageUrl }}
                className="ml-2 h-14 w-14 shrink-0 rounded-xl"
                resizeMode="cover"
              />
            ) : null}
          </View>
        </View>

        <View className="h-px bg-neutral-200 dark:bg-neutral-700" />

        <View className="rounded-xl border border-dashed border-neutral-300 bg-light-primary/60 p-3 dark:border-neutral-600 dark:bg-dark-darker/40">
          <ThemedText className="mb-1 text-xs font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
            {t('rescheduleCurrentTimeHeading')}
          </ThemedText>
          <ThemedText className="mb-3 text-xs leading-5 text-light-subtext dark:text-dark-subtext">
            {t('rescheduleCurrentTimeHint')}
          </ThemedText>
          <ThemedText className="mb-2 text-base font-semibold text-light-subtext line-through decoration-neutral-400 decoration-2 dark:text-dark-subtext dark:decoration-neutral-500">
            {dateLabel}
          </ThemedText>
          <View className="flex-row items-center justify-between rounded-lg border border-neutral-200/80 bg-light-secondary/80 p-3 dark:border-neutral-600/80 dark:bg-dark-secondary/80">
            <View>
              <ThemedText className="text-xs text-light-subtext opacity-80 dark:text-dark-subtext">
                {t('reservationSummaryFrom')}
              </ThemedText>
              <ThemedText className="text-base font-semibold text-light-subtext line-through decoration-neutral-400 decoration-2 dark:text-dark-subtext dark:decoration-neutral-500">
                {booking.slotStart ?? '—'}
              </ThemedText>
            </View>
            <View className="items-end">
              <ThemedText className="text-xs text-light-subtext opacity-80 dark:text-dark-subtext">
                {t('reservationSummaryTo')}
              </ThemedText>
              <ThemedText className="text-base font-semibold text-light-subtext line-through decoration-neutral-400 decoration-2 dark:text-dark-subtext dark:decoration-neutral-500">
                {booking.slotEnd ?? '—'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
