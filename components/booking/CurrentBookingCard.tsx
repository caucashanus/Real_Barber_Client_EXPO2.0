import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import type { Booking } from '@/api/bookings';

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
    <View className="mt-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-light-secondary dark:bg-dark-secondary overflow-hidden">
      <View className="p-4 gap-4">
        <View>
          <ThemedText className="text-xs font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext mb-1.5">
            {t('reservationSummaryBranch')}
          </ThemedText>
          <ThemedText className="text-lg font-bold text-light-text dark:text-dark-text">
            {booking.branch?.name ?? '—'}
          </ThemedText>
          {booking.branch?.address ? (
            <View className="flex-row items-start mt-2">
              <Icon
                name="MapPin"
                size={16}
                className="mr-2 mt-0.5 text-light-subtext dark:text-dark-subtext shrink-0"
              />
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext flex-1 leading-5">
                {booking.branch.address}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View className="h-px bg-neutral-200 dark:bg-neutral-700" />

        <View>
          <ThemedText className="text-xs font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext mb-2">
            {t('bookingInCareOf')}
          </ThemedText>
          <View className="flex-row items-center">
            <Avatar size="md" src={booking.employee?.avatarUrl ?? undefined} name={booking.employee?.name} />
            <View className="ml-3 flex-1 min-w-0">
              <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text" numberOfLines={1}>
                {booking.employee?.name ?? '—'}
              </ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1" numberOfLines={2}>
                {booking.item?.name ?? '—'}
              </ThemedText>
            </View>
            {booking.item?.imageUrl ? (
              <Image
                source={{ uri: booking.item.imageUrl }}
                className="w-14 h-14 rounded-xl ml-2 shrink-0"
                resizeMode="cover"
              />
            ) : null}
          </View>
        </View>

        <View className="h-px bg-neutral-200 dark:bg-neutral-700" />

        <View className="rounded-xl bg-light-primary/60 dark:bg-dark-darker/40 border border-dashed border-neutral-300 dark:border-neutral-600 p-3">
          <ThemedText className="text-xs font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext mb-1">
            {t('rescheduleCurrentTimeHeading')}
          </ThemedText>
          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext leading-5 mb-3">
            {t('rescheduleCurrentTimeHint')}
          </ThemedText>
          <ThemedText className="text-base font-semibold text-light-subtext dark:text-dark-subtext line-through decoration-2 decoration-neutral-400 dark:decoration-neutral-500 mb-2">
            {dateLabel}
          </ThemedText>
          <View className="flex-row items-center justify-between rounded-lg bg-light-secondary/80 dark:bg-dark-secondary/80 border border-neutral-200/80 dark:border-neutral-600/80 p-3">
            <View>
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext opacity-80">
                {t('reservationSummaryFrom')}
              </ThemedText>
              <ThemedText className="text-base font-semibold text-light-subtext dark:text-dark-subtext line-through decoration-2 decoration-neutral-400 dark:decoration-neutral-500">
                {booking.slotStart ?? '—'}
              </ThemedText>
            </View>
            <View className="items-end">
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext opacity-80">
                {t('reservationSummaryTo')}
              </ThemedText>
              <ThemedText className="text-base font-semibold text-light-subtext dark:text-dark-subtext line-through decoration-2 decoration-neutral-400 dark:decoration-neutral-500">
                {booking.slotEnd ?? '—'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
