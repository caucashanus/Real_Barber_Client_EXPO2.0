import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import HomeFastBookRowInset from '@/components/home/fast-book/HomeFastBookRowInset';
import SiteLoadingState from '@/components/SiteLoadingState';
import ThemedText from '@/components/ThemedText';
import { HOME_FAST_BOOK_AFTER_SERVICES_CLASS } from '@/components/home/fast-book/homeFastBookSheetUi';
import type { TranslationKey } from '@/locales';
import { pickRecentHomeBookings } from '@/utils/pickRecentHomeBookings';
import { buildRepeatReservationHref } from '@/utils/repeatBooking';

type Props = {
  bookings: Booking[] | null | undefined;
  loading?: boolean;
  t: (key: TranslationKey) => string;
  onCloseSheet: () => void;
};

function repeatBookingMetaLine(booking: Booking): string {
  return [booking.employee?.name?.trim(), booking.branch?.name?.trim()]
    .filter(Boolean)
    .join(' · ');
}

export default function HomeFastBookRepeatSection({ bookings, loading, t, onCloseSheet }: Props) {
  const recent = useMemo(
    () => (bookings == null ? [] : pickRecentHomeBookings(bookings, 3)),
    [bookings]
  );

  if (loading && bookings == null) {
    return (
      <View className={`w-full ${HOME_FAST_BOOK_AFTER_SERVICES_CLASS}`}>
        <HomeFastBookRowInset>
          <ThemedText className="mb-2 text-base font-semibold">{t('fastBookRepeatTitle')}</ThemedText>
          <SiteLoadingState layout="inline" />
        </HomeFastBookRowInset>
      </View>
    );
  }

  if (recent.length === 0) return null;

  return (
    <View className={`w-full ${HOME_FAST_BOOK_AFTER_SERVICES_CLASS}`}>
      <HomeFastBookRowInset className="mb-2">
        <ThemedText className="text-base font-semibold">{t('fastBookRepeatTitle')}</ThemedText>
      </HomeFastBookRowInset>
      <View className="w-full">
        {recent.map((booking, index) => {
          const meta = repeatBookingMetaLine(booking);
          return (
            <Pressable
              key={booking.id}
              onPress={() => {
                onCloseSheet();
                router.push(buildRepeatReservationHref(booking) as never);
              }}
              className="w-full active:opacity-70">
              {index > 0 ? (
                <HomeFastBookRowInset>
                  <View className="h-px bg-neutral-200 dark:bg-neutral-700" />
                </HomeFastBookRowInset>
              ) : null}
              <HomeFastBookRowInset>
                <View className="flex-row items-center gap-3.5 py-3">
                  <Avatar
                    size="md"
                    src={booking.employee?.avatarUrl ?? undefined}
                    name={booking.employee?.name ?? undefined}
                    className="shrink-0"
                  />
                  <View className="min-w-0 flex-1">
                    <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                      {booking.item?.name?.trim() || t('homeRecentDefaultName')}
                    </ThemedText>
                    {meta ? (
                      <ThemedText
                        className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                        numberOfLines={1}>
                        {meta}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Icon
                    name="ChevronRight"
                    size={18}
                    className="text-light-subtext dark:text-dark-subtext"
                  />
                </View>
              </HomeFastBookRowInset>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
