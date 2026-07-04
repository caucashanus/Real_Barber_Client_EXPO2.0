import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { buildRepeatReservationHref } from '@/utils/repeatBooking';

function RepeatBookingParamPill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-neutral-800 px-2.5 py-1 dark:bg-neutral-200">
      <ThemedText className="text-xs font-semibold text-white dark:text-neutral-900">{label}</ThemedText>
    </View>
  );
}

export function HomeRepeatBookingCard({
  booking,
  t,
}: {
  booking: Booking;
  t: (key: TranslationKey) => string;
}) {
  const itemName = booking.item?.name?.trim();
  const branchName = booking.branch?.name?.trim();
  const employeeName = booking.employee?.name?.trim();

  return (
    <View className="mb-2" style={{ overflow: 'visible' }}>
      <Pressable
        onPress={() => router.push(buildRepeatReservationHref(booking) as any)}
        accessibilityRole="button"
        className="active:opacity-70">
        <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          <View className="flex-1 flex-row items-center gap-3 px-4 py-4 pb-5">
            <View className="min-w-0 flex-1">
              <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                {t('homeRepeatBookingTitle')}
              </ThemedText>
              {employeeName ? (
                <ThemedText
                  className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                  numberOfLines={1}>
                  {employeeName}
                </ThemedText>
              ) : null}
            </View>
            <Avatar
              src={booking.employee?.avatarUrl ?? undefined}
              name={booking.employee?.name}
              size="md"
            />
            <Icon
              name="ChevronRight"
              size={16}
              className="text-light-subtext dark:text-dark-subtext"
            />
          </View>
        </View>
        {itemName ? (
          <View className="absolute" style={{ top: -8, left: 12, maxWidth: '72%' }}>
            <RepeatBookingParamPill label={itemName} />
          </View>
        ) : null}
        {branchName ? (
          <View className="absolute" style={{ bottom: -10, right: 12, maxWidth: '72%' }}>
            <RepeatBookingParamPill label={branchName} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
